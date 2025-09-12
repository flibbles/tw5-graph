/*\

Tests the graphengine javascript macro.

\*/

describe('graphengine macro', function() {

var wiki, config = "$:/config/flibbles/graph/engine";

beforeEach(function() {
	wiki = new $tw.Wiki();
});

function engine() {
	return wiki.renderText("text/html",
		"text/vnd.tiddlywiki",
		"<$text text=<<graphengine>> />\n");
};

it("uses first available engine if none specified", function() {
	expect(engine()).toBe("Also");
});

it("can specify something", function() {
	wiki.addTiddler({title: config, text: "Test"});
	expect(engine()).toBe("Test");
});

it("ignores blank config ", function() {
	wiki.addTiddler({title: config, text: ""});
	expect(engine()).toBe("Also");
});

it("passes along missing engine, knowing it will fail", function() {
	wiki.addTiddler({title: config, text: "Missing"});
	expect(engine()).toBe("Missing");
});

it("can update", function() {
	wiki.addTiddler({title: config, text: "Also"});
	expect(engine()).toBe("Also");
	wiki.addTiddler({title: config, text: "Test"});
	expect(engine()).toBe("Test");
});

});
