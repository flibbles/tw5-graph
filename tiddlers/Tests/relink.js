/*\

Tests all relinking.

\*/

describe("Relink", function() {

var dictType = "application/x-tiddler-dictionary";

function testTiddler(tiddler, expected, report, options) {
	const wiki = new $tw.Wiki();
};

it("reports json graph tiddlers", function() {
	const wiki = new $tw.Wiki();
	var json = {A: "3,5", B: "value"};
	var title = "$:/graph/view/test";
	wiki.addTiddler({title: title, type: "application/json", text: JSON.stringify(json)});
	var report = wiki.getTiddlerRelinkReferences(title);
	expect(report).toEqual({A: ["3,5"], B: ["value"]});
	// Reports must be soft, so these don't show up as "missing" tiddlers.
	expect(wiki.filterTiddlers(`[[${title}]relink:references[]]`)).toEqual(["A", "B"]);
	expect(wiki.filterTiddlers(`[[${title}]relink:references:hard[]]`)).toEqual([]);
});

it("reports dictionary graph tiddlers", function() {
	const wiki = new $tw.Wiki();
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
	const wiki = new $tw.Wiki();
	var json = {a: "val", "from here": "3,5", g: "val"};
	var data = JSON.stringify(json);
	var title = "$:/graph/view/test";
	spyOn(console, "log");
	wiki.addTiddler({title: title, type: "application/json", text: data});
	wiki.renameTiddler("from here", "to there");
	expect(wiki.getTiddlerData(title)).toEqual({a: "val", "to there": "3,5", g: "val"});
	// Maintains pretty printing
	// Also, maintains same general order
	expect(wiki.getTiddlerText(title)).toEqual('{\n    "a": "val",\n    "to there": "3,5",\n    "g": "val"\n}');
});

it("relinks dictionary graph tiddlers", function() {
	const wiki = new $tw.Wiki();
	var data = "from here: 3,5\nB: value";
	var title = "$:/graph/view/test";
	spyOn(console, "log");
	wiki.addTiddler({title: title, type: dictType, text: data});
	wiki.renameTiddler("from here", "to there");
	expect(wiki.getTiddlerData(title)).toEqual({"to there": "3,5", B: "value"});
});

it("relinks impossible dictionary graph tiddlers with json", function() {
	const wiki = new $tw.Wiki();
	var data = "from here: 3,5\nB: value";
	var title = "$:/graph/view/test";
	spyOn(console, "log");
	wiki.addTiddler({title: title, type: dictType, text: data});
	wiki.renameTiddler("from here", "to:there");
	expect(wiki.getTiddlerData(title)).toEqual({"to:there": "3,5", B: "value"});
	expect(wiki.getTiddler(title).fields.type).toBe("application/json");
});

it("empty values do not stop relinking", function() {
	const wiki = new $tw.Wiki();
	var json = {"from here": ""};
	var data = JSON.stringify(json);
	var title = "$:/graph/view/test";
	spyOn(console, "log");
	wiki.addTiddler({title: title, type: "application/json", text: data});
	wiki.renameTiddler("from here", "to there");
	expect(wiki.getTiddlerData(title)).toEqual({"to there": ""});
});

it("does not touch data tiddlers outside the namespace", function() {
	const wiki = new $tw.Wiki();
	var json = {"from here": "3,5"};
	var data = JSON.stringify(json);
	var title = "$:/notgraph/view/test";
	wiki.addTiddler({title: title, type: "application/json", text: data});
	wiki.renameTiddler("from here", "to there");
	expect(wiki.getTiddlerData(title)).toEqual({"from here": "3,5"});
	// It also does not report anything
	expect(wiki.getTiddlerRelinkReferences(title)).toEqual({});
});

it("does not touch non-data tiddlers inside the namespace", function() {
	const wiki = new $tw.Wiki();
	var json = {"from here": "3,5"};
	var data = JSON.stringify(json);
	var title = "$:/graph/view/test";
	wiki.addTiddler({title: title, type: "text/vnd.tiddlywiki", text: data});
	wiki.renameTiddler("from here", "to there");
	expect(wiki.getTiddlerText(title)).toEqual(data);
	// It also does not report anything
	expect(wiki.getTiddlerRelinkReferences(title)).toEqual({});
});

});
