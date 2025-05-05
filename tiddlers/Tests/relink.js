/*\

Tests all relinking.

\*/

describe("Relink", function() {

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
	wiki.addTiddler({title: title, type: "application/x-tiddler-dictionary", text: data});
	var report = wiki.getTiddlerRelinkReferences(title);
	expect(report).toEqual({A: ["3,5"], B: ["value"]});
	// Reports must be soft, so these don't show up as "missing" tiddlers.
	expect(wiki.filterTiddlers(`[[${title}]relink:references[]]`)).toEqual(["A", "B"]);
	expect(wiki.filterTiddlers(`[[${title}]relink:references:hard[]]`)).toEqual([]);
});

// TODO: Doesn't relink or report on non $:/graph data tiddlers
// TODO: Empty value don't stop relinking (falsy values)
// TODO: Leaves non data tiddlers in the namespace alone
// TODO: Maintains pretty-printing

it("relinks json graph tiddlers", function() {
	const wiki = new $tw.Wiki();
	var json = {"from here": "3,5", B: "value"};
	var title = "$:/graph/view/test";
	spyOn(console, "log");
	wiki.addTiddler({title: title, type: "application/json", text: JSON.stringify(json)});
	wiki.renameTiddler("from here", "to there");
	expect(wiki.getTiddlerData(title)).toEqual({"to there": "3,5", B: "value"});
});

});
