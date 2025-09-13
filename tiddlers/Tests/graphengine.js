/*\

Tests the graphengine javascript macro.

\*/

describe('graphengine macro', function() {

var wiki, config = "$:/config/flibbles/graph/engine";

beforeEach(function() {
	wiki = new $tw.Wiki();
	wiki.addTiddler($tw.wiki.getTiddler("$:/core/config/GlobalImportFilter").fields);
});

function engine() {
	var text = "\\import [subfilter{$:/core/config/GlobalImportFilter}]\n<$text text=<<graphengine>> />\n";
	return wiki.renderText("text/html", "text/vnd.tiddlywiki", text);
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

it("can be overridden", function() {
	wiki.addTiddler({title: "Macro", tags: "$:/tags/Global", text: "\\procedure graphengine() Alternate"});
	wiki.addTiddler({title: config, text: "Alternate"});
});

});
