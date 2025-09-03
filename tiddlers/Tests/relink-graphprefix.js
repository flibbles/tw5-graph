/*\

Tests all relinking in $:/graph namespace,

and also any that have the $:/tags/flibbles/graph/TiddlerData tag

\*/

describe("Relink graph tiddlers", function() {

var language = require('$:/plugins/flibbles/relink/js/language.js');
var dictType = "application/x-tiddler-dictionary";
var jsonType = "application/json";
var title = "$:/graph/view/test";
var tag = "$:/tags/flibbles/graph/TiddlerData";
var engineConfig = "$:/config/flibbles/graph/engine";
var wiki, log, failures;

beforeEach(function() {
	wiki = new $tw.Wiki();
	wiki.addTiddler({title: engineConfig, text: "Test"});
	log = spyOn(console, "log");
	failures = spyOn(language, "reportFailures");
});

it("reports json graph tiddlers", function() {
	var json = {A: "3,5", B: "value"};
	wiki.addTiddler({title: title, type: jsonType, text: JSON.stringify(json)});
	var report = wiki.getTiddlerRelinkReferences(title);
	expect(report).toEqual({A: ["3,5"], B: ["value"]});
	// Reports must be soft, so these don't show up as "missing" tiddlers.
	expect(wiki.filterTiddlers(`[[${title}]relink:references[]]`)).toEqual(["A", "B"]);
	expect(wiki.filterTiddlers(`[[${title}]relink:references:hard[]]`)).toEqual([]);
});

it("reports dictionary graph tiddlers", function() {
	var data = "A: 3,5\nB: value";
	wiki.addTiddler({title: title, type: dictType, text: data});
	var report = wiki.getTiddlerRelinkReferences(title);
	expect(report).toEqual({A: ["3,5"], B: ["value"]});
	// Reports must be soft, so these don't show up as "missing" tiddlers.
	expect(wiki.filterTiddlers(`[[${title}]relink:references[]]`)).toEqual(["A", "B"]);
	expect(wiki.filterTiddlers(`[[${title}]relink:references:hard[]]`)).toEqual([]);
});

it("relinks json graph tiddlers", function() {
	var json = {a: "val", "from here": "3,5", g: "val"};
	var data = JSON.stringify(json);
	wiki.addTiddler({title: title, type: jsonType, text: data});
	wiki.renameTiddler("from here", "to there");
	expect(wiki.getTiddlerData(title)).toEqual({a: "val", "to there": "3,5", g: "val"});
	// Maintains pretty printing
	// Also, maintains same general order
	expect(wiki.getTiddlerText(title)).toEqual('{\n    "a": "val",\n    "to there": "3,5",\n    "g": "val"\n}');
});

it("relinks dictionary graph tiddlers", function() {
	var data = "from here: 3,5\nB: value";
	wiki.addTiddler({title: title, type: dictType, text: data});
	wiki.renameTiddler("from here", "to there");
	expect(wiki.getTiddlerData(title)).toEqual({"to there": "3,5", B: "value"});
});

it("relinks impossible dictionary graph tiddlers with json", function() {
	var data = "from here: 3,5\nB: value";
	wiki.addTiddler({title: title, type: dictType, text: data});
	wiki.renameTiddler("from here", "to:there");
	expect(wiki.getTiddlerData(title)).toEqual({"to:there": "3,5", B: "value"});
	expect(wiki.getTiddler(title).fields.type).toBe(jsonType);
});

it("empty values do not stop relinking", function() {
	var json = {"from here": ""};
	var data = JSON.stringify(json);
	wiki.addTiddler({title: title, type: jsonType, text: data});
	wiki.renameTiddler("from here", "to there");
	expect(wiki.getTiddlerData(title)).toEqual({"to there": ""});
});

it("does not touch data tiddlers outside the namespace", function() {
	var json = {"from here": "3,5"};
	var data = JSON.stringify(json);
	var title = "$:/notgraph/view/test";
	wiki.addTiddler({title: title, type: jsonType, text: data});
	wiki.renameTiddler("from here", "to there");
	expect(wiki.getTiddlerData(title)).toEqual({"from here": "3,5"});
	// It also does not report anything
	expect(wiki.getTiddlerRelinkReferences(title)).toEqual({});
	expect(log).not.toHaveBeenCalled();
});

it("does not touch non-data tiddlers inside the namespace", function() {
	var json = {"from here": "3,5"};
	var data = JSON.stringify(json);
	wiki.addTiddler({title: title, type: "text/vnd.tiddlywiki", text: data});
	wiki.renameTiddler("from here", "to there");
	expect(wiki.getTiddlerText(title)).toEqual(data);
	// It also does not report anything
	expect(wiki.getTiddlerRelinkReferences(title)).toEqual({});
	expect(log).not.toHaveBeenCalled();
});

it("reports data tiddlers with the explicit tag", function() {
	var json = {A: "3,5"};
	wiki.addTiddler({title: "test", tags: tag, type: jsonType, text: JSON.stringify(json)});
	var report = wiki.getTiddlerRelinkReferences("test");
	expect(report).toEqual({A: ["3,5"]});
	// Reports must be soft, so these don't show up as "missing" tiddlers.
	expect(wiki.filterTiddlers(`[[test]relink:references[]]`)).toEqual(["A"]);
	expect(wiki.filterTiddlers(`[[test]relink:references:hard[]]`)).toEqual([]);
});

it("does not double report explicit and namespaced tiddlers", function() {
	var json = {A: "3,5"};
	wiki.addTiddler({title: title, tags: tag, type: jsonType, text: JSON.stringify(json)});
	var report = wiki.getTiddlerRelinkReferences(title);
	expect(report).toEqual({A: ["3,5"]});
	// Reports must be soft, so these don't show up as "missing" tiddlers.
	expect(wiki.filterTiddlers(`[[${title}]relink:references[]]`)).toEqual(["A"]);
});

it("relinks data tiddlers with the explicit tag", function() {
	var json = {"from here": "3,5"};
	var data = JSON.stringify(json);
	wiki.addTiddler({title: "test", tags: tag, type: jsonType, text: data});
	wiki.renameTiddler("from here", "to there");
	expect(wiki.getTiddlerData("test")).toEqual({"to there": "3,5"});
	// Maintains pretty printing
	// Also, maintains same general order
	expect(wiki.getTiddlerText("test")).toEqual('{\n    "to there": "3,5"\n}');
});

});
