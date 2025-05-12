/*\

Tests relinking in attributes.

\*/

describe("Relink attributes", function() {

var wiki, log;
var language = require('$:/plugins/flibbles/relink/js/language.js');
var engineConfig = "$:/config/flibbles/graph/engine";
var title = "Test";

beforeEach(function() {
	wiki = new $tw.Wiki();
	wiki.addTiddler({title: engineConfig, text: "Test"});
	log = spyOn(console, "log");
});

// TODO: $for="" should be treated as nodes

it("reports and relinks $properties without $for", function() {
	wiki.addTiddler({title: title, text: "<$properties delete='{{from}}'/>"});
	var report = wiki.getTiddlerRelinkReferences("Test");
	expect(report).toEqual({"from": ['<$properties delete="{{}}" />']});
	wiki.renameTiddler("from here", "to there");
	expect(wiki.getTiddlerText(title)).toBe("<$properties delete='{{from}}'/>");
});

});
