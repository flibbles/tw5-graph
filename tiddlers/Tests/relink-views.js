/*\

Tests all relinking.

\*/

describe("Relink views", function() {

var dictType = "application/x-tiddler-dictionary";
var jsonType = "application/json";
var wiki, log;

beforeEach(function() {
	wiki = new $tw.Wiki();
	log = spyOn(console, "log");
});

it("reports json graph tiddlers", function() {
	var json = {A: "3,5", B: "value"};
	var title = "$:/graph/view/test";
	wiki.addTiddler({title: title, type: jsonType, text: JSON.stringify(json)});
	var report = wiki.getTiddlerRelinkReferences(title);
	expect(report).toEqual({A: ["3,5"], B: ["value"]});
	// Reports must be soft, so these don't show up as "missing" tiddlers.
	expect(wiki.filterTiddlers(`[[${title}]relink:references[]]`)).toEqual(["A", "B"]);
	expect(wiki.filterTiddlers(`[[${title}]relink:references:hard[]]`)).toEqual([]);
});

it("reports dictionary graph tiddlers", function() {
	var data = "A: 3,5\nB: value";
	var title = "$:/graph/view/test";
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
	var title = "$:/graph/view/test";
	wiki.addTiddler({title: title, type: jsonType, text: data});
	wiki.renameTiddler("from here", "to there");
	expect(wiki.getTiddlerData(title)).toEqual({a: "val", "to there": "3,5", g: "val"});
	// Maintains pretty printing
	// Also, maintains same general order
	expect(wiki.getTiddlerText(title)).toEqual('{\n    "a": "val",\n    "to there": "3,5",\n    "g": "val"\n}');
});

it("relinks dictionary graph tiddlers", function() {
	var data = "from here: 3,5\nB: value";
	var title = "$:/graph/view/test";
	wiki.addTiddler({title: title, type: dictType, text: data});
	wiki.renameTiddler("from here", "to there");
	expect(wiki.getTiddlerData(title)).toEqual({"to there": "3,5", B: "value"});
});

it("relinks impossible dictionary graph tiddlers with json", function() {
	var data = "from here: 3,5\nB: value";
	var title = "$:/graph/view/test";
	wiki.addTiddler({title: title, type: dictType, text: data});
	wiki.renameTiddler("from here", "to:there");
	expect(wiki.getTiddlerData(title)).toEqual({"to:there": "3,5", B: "value"});
	expect(wiki.getTiddler(title).fields.type).toBe(jsonType);
});

it("empty values do not stop relinking", function() {
	var json = {"from here": ""};
	var data = JSON.stringify(json);
	var title = "$:/graph/view/test";
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
	var title = "$:/graph/view/test";
	wiki.addTiddler({title: title, type: "text/vnd.tiddlywiki", text: data});
	wiki.renameTiddler("from here", "to there");
	expect(wiki.getTiddlerText(title)).toEqual(data);
	// It also does not report anything
	expect(wiki.getTiddlerRelinkReferences(title)).toEqual({});
	expect(log).not.toHaveBeenCalled();
});

});
