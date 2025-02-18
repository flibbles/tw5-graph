/*\

Tests flibbles/graph's utility methods

\*/

describe('Utils', function() {

var utils = require("$:/plugins/flibbles/graph/utils.js");

it("can fetch single engine automatically", function() {
	var wiki = new $tw.Wiki();
	spyOn(utils, "getEngineMap").and.returnValue({only: "Only Value"});
	expect(utils.getEngine(wiki)).toBe("Only Value");
	expect(utils.getEngine(wiki, "")).toBe("Only Value");
});

it("chooses first engine if multiple exist and not specified", function() {
	var wiki = new $tw.Wiki();
	spyOn(utils, "getEngineMap").and.returnValue({First: "First", Second: "Second"});
	expect(utils.getEngine(wiki)).toBe("First");
	expect(utils.getEngine(wiki, "")).toBe("First");
});

it("can fetch engine specified by settings", function() {
	var wiki = new $tw.Wiki();
	wiki.addTiddler({title: "$:/config/flibbles/graph/engine", text: "Last"});
	spyOn(utils, "getEngineMap").and.returnValue({First: "bad", Last: "good"});
	expect(utils.getEngine(wiki)).toBe("good");
	expect(utils.getEngine(wiki, "")).toBe("good");
});

it("is helpful when global setting is incorrect", function() {
	var wiki = new $tw.Wiki();
	wiki.addTiddler({title: "$:/config/flibbles/graph/engine", text: "Bad"});
	spyOn(utils, "getEngineMap").and.returnValue({First: "good"});
	expect( function() { utils.getEngine(wiki); }).toThrowError("Graph plugin configured to use missing 'Bad' engine. Fix this in plugin settings.");
});

it('can fetch engine explicitly', function() {
	var wiki = new $tw.Wiki();
	spyOn(utils, "getEngineMap").and.returnValue({First: "bad", Last: "good"});
	expect(utils.getEngine(wiki, "Last")).toBe("good");
	wiki.addTiddler({title: "$:/config/flibbles/graph/engine", text: "First"});
	expect(utils.getEngine(wiki, "Last")).toBe("good");
	expect( function() { utils.getEngine(wiki, "Missing"); }).toThrowError("'Missing' graphing library not found.");
});

it('recognizes when no libraries are installed', function() {
	var wiki = new $tw.Wiki();
	var error = "No graphing libraries installed.";
	spyOn(utils, "getEngineMap").and.returnValue({});
	expect( function() { utils.getEngine(wiki); }).toThrowError(error);
	expect( function() { utils.getEngine(wiki, "Anything"); }).toThrowError(error);
	wiki.addTiddler({title: "$:/config/flibbles/graph/engine", text: "Anything"});
	expect( function() { utils.getEngine(wiki); }).toThrowError(error);
});


});
