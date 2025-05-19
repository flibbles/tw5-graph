/*\

Tests all relinking.

\*/

describe("Relink views", function() {

var language = require('$:/plugins/flibbles/relink/js/language.js');
var dictType = "application/x-tiddler-dictionary";
var jsonType = "application/json";
var title = "$:/graph/view/test";
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

/*** Property fields ***/

it("reports property fields", function() {
	wiki.addTiddler({title: title, text: '{"A": "23,34"}', type: "application/json", "graph.graph": '{"addNode":"{{B}}"}'});
	var report = wiki.getTiddlerRelinkReferences(title);
	expect(report).toEqual({A: ["23,34"], B: ["#graph - addNode: {{}}"]});
});

it("report handles corrupt property fields", function() {
	wiki.addTiddler({title: title, text: '{"A": "23,34"}', type: "application/json", "graph.graph": '{"addNode":'});
	var report = wiki.getTiddlerRelinkReferences(title);
	expect(report).toEqual({A: ["23,34"]});
});

it("relinks property fields", function() {
	var json = {a: "val", "from here": "3,5", g: "val"};
	var data = JSON.stringify(json);
	wiki.addTiddler({title: title,
		type: jsonType,
		text: '{\n    "from": "2,3"\n}',
		"graph.graph": '{"addNode":"{{from}}"}',
		"graph.nodes": '{"delete":"[[cap|from]]"}'});
	wiki.renameTiddler("from", "to");
	expect(wiki.getTiddler(title).fields).toEqual({
		title: title,
		type: jsonType,
		text: '{\n    "to": "2,3"\n}',
		"graph.graph": '{"addNode":"{{to}}"}',
		"graph.nodes": '{"delete":"[[cap|to]]"}'});
});

it("relink handles impossibles", function() {
	wiki.addTiddler({title: title,
		type: jsonType,
		"graph.graph": '{"addNode":"<$text text={{from}}/>"}',
		"graph.nodes": '{"delete":"[[cap|from]]"}'});
	wiki.renameTiddler("from", "t}}o");
	expect(wiki.getTiddler(title).fields).toEqual({
		title: title,
		type: jsonType,
		"graph.graph": '{"addNode":"<$text text={{from}}/>"}',
		"graph.nodes": '{"delete":"[[cap|t}}o]]"}'});
	expect(failures).toHaveBeenCalled();
});

// I do this for now in case of empty data-tiddlers never getting set,
// but if I switch to a custom MIME type, this will have to change.
it("relinks non-dataTiddler property fields", function() {
	wiki.addTiddler({title: title, "graph.graph": '{"addNode":"{{from}}"}'});
	wiki.renameTiddler("from", "to");
	expect(wiki.getTiddler(title).fields).toEqual({
		title: title, "graph.graph": '{"addNode":"{{to}}"}'});
});

it("relink ignores corrupt fields", function() {
	wiki.addTiddler({title: title,
		type: jsonType,
		"graph.nodes": '{"delete":"{{from}}'});
	wiki.renameTiddler("from", "to");
	expect(wiki.getTiddler(title).fields).toEqual({
		title: title,
		type: jsonType,
		"graph.nodes": '{"delete":"{{from}}'});
});

});
