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

it("reports and relinks $properties without $for", function() {
	wiki.addTiddler({title: title, text: "<$properties delete='{{from}}'/>"});
	var report = wiki.getTiddlerRelinkReferences("Test");
	expect(report).toEqual({from: ['<$properties delete="{{}}" />']});
	wiki.renameTiddler("from", "to");
	expect(wiki.getTiddlerText(title)).toBe("<$properties delete='{{to}}'/>");
});

it("reports and relinks $properties with $for", function() {
	wiki.addTiddler({title: title, text: "<$properties $for=graph addNode='{{from}}'/>"});
	var report = wiki.getTiddlerRelinkReferences("Test");
	expect(report).toEqual({from: ['<$properties addNode="{{}}" />']});
	wiki.renameTiddler("from", "to");
	expect(wiki.getTiddlerText(title)).toBe("<$properties $for=graph addNode='{{to}}'/>");
});

it("ignores $properties with weird $for", function() {
	var text =  "<$properties $for=weird addNode='{{from}}'/>";
	wiki.addTiddler({title: title, text: text});
	var report = wiki.getTiddlerRelinkReferences("Test");
	expect(report).toEqual({});
	wiki.renameTiddler("from", "to");
	expect(wiki.getTiddlerText(title)).toBe(text);
});

it("ignores $properties with empty $for", function() {
	var text =  "<$properties $for={{For!!noexist}} addNode='{{from}}' delete='{{from}}'/>";
	wiki.addTiddler({title: "For", text: "text"});
	wiki.addTiddler({title: title, text: text});
	var report = wiki.getTiddlerRelinkReferences("Test");
	expect(report).toEqual({For: ["<$properties $for={{!!noexist}} />"]});
	wiki.renameTiddler("from", "to");
	expect(wiki.getTiddlerText(title)).toBe(text);
});

it("reports and relinks $nodes", function() {
	wiki.addTiddler({title: title, text: "<$node hover='{{from}}' addNode='{{from}}'/>"});
	var report = wiki.getTiddlerRelinkReferences("Test");
	expect(report).toEqual({from: ['<$node hover="{{}}" />']});
	wiki.renameTiddler("from", "to");
	expect(wiki.getTiddlerText(title)).toBe("<$node hover='{{to}}' addNode='{{from}}'/>");
});

it("reports and relinks $edges", function() {
	wiki.addTiddler({title: title, text: "<$edge delete='{{from}}' noexist='{{from}}'/>"});
	var report = wiki.getTiddlerRelinkReferences("Test");
	expect(report).toEqual({from: ['<$edge delete="{{}}" />']});
	wiki.renameTiddler("from", "to");
	expect(wiki.getTiddlerText(title)).toBe("<$edge delete='{{to}}' noexist='{{from}}'/>");
});

it("reports and relinks $graph", function() {
	wiki.addTiddler({title: title, text: "<$graph addNode='{{from}}' delete='{{from}}' />"});
	var report = wiki.getTiddlerRelinkReferences("Test");
	expect(report).toEqual({from: ['<$graph addNode="{{}}" />']});
	wiki.renameTiddler("from", "to");
	expect(wiki.getTiddlerText(title)).toBe("<$graph addNode='{{to}}' delete='{{from}}' />");
});

it("does nothing when no engine installed", function() {
	spyOn($tw.test.utils, "getEngineMap").and.returnValue({});
	wiki.deleteTiddler(engineConfig);
	var text =  "<$graph addNode='{{from}}' />";
	wiki.addTiddler({title: title, text: text});
	wiki.renameTiddler("from", "to");
	expect(wiki.getTiddlerText(title)).toEqual(text);
});

it("does nothing when engine incorrectly configured", function() {
	wiki.addTiddler({title: engineConfig, text: "No-exists"});
	var text =  "<$graph addNode='{{from}}' />";
	wiki.addTiddler({title: title, text: text});
	wiki.renameTiddler("from", "to");
	expect(wiki.getTiddlerText(title)).toEqual(text);
});

});
