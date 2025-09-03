/*\

Tests relinking of graph.* property fields.

\*/

describe("Relink property fields", function() {

var language = require('$:/plugins/flibbles/relink/js/language.js');
var title = "$:/graph/view/test";
var engineConfig = "$:/config/flibbles/graph/engine";
var wiki, log, failures;

beforeEach(function() {
	wiki = new $tw.Wiki();
	wiki.addTiddler({title: engineConfig, text: "Test"});
	log = spyOn(console, "log");
	failures = spyOn(language, "reportFailures");
});

it("reports property fields of fields and graphTiddlers", function() {
	wiki.addTiddler({title: title, text: '{"A": "23,34"}', type: "application/json", "graph.graph": '{"addNode":"{{B}}"}'});
	var report = wiki.getTiddlerRelinkReferences(title);
	expect(report).toEqual({A: ["23,34"], B: ["#graph - addNode: {{}}"]});
});

it("report handles corrupt property fields", function() {
	wiki.addTiddler({title: "test",
		"graph.nodes": '{"actions": "{{A}}"}',
		"graph.graph": '{"addNode":'});
	var report = wiki.getTiddlerRelinkReferences("test");
	expect(report).toEqual({A: ["#nodes - actions: {{}}"]});
});

it("relinks property fields and graphTiddlers too", function() {
	var json = {a: "val", "from here": "3,5", g: "val"};
	var jsonType = "application/json";
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
	wiki.addTiddler({title: "test",
		"graph.graph": '{"addNode":"<$text text={{from}}/>"}',
		"graph.nodes": '{"delete":"[[cap|from]]"}'});
	wiki.renameTiddler("from", "t}}o");
	expect(wiki.getTiddler("test").fields).toEqual({
		title: "test",
		"graph.graph": '{"addNode":"<$text text={{from}}/>"}',
		"graph.nodes": '{"delete":"[[cap|t}}o]]"}'});
	expect(failures).toHaveBeenCalled();
});

it("relinks non-dataTiddler property fields", function() {
	wiki.addTiddler({title: "test", "graph.graph": '{"addNode":"{{from}}"}'});
	wiki.renameTiddler("from", "to");
	expect(wiki.getTiddler("test").fields).toEqual({
		title: "test", "graph.graph": '{"addNode":"{{to}}"}'});
});

it("relink ignores corrupt fields", function() {
	wiki.addTiddler({title: "test",
		"graph.nodes": '{"delete":"{{from}}'});
	wiki.renameTiddler("from", "to");
	expect(wiki.getTiddler("test").fields).toEqual({
		title: "test",
		"graph.nodes": '{"delete":"{{from}}'});
});

});
