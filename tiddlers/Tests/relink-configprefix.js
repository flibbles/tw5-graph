/*\

Tests relinking of dataTiddlers in $:/config/flibbles/graph/...

\*/

describe("Relink config prefix", function() {

var jsonType = "application/json";
var dictType = "application/x-tiddler-dictionary";
var language = require('$:/plugins/flibbles/relink/js/language.js');
// A common title for a graph properties tiddler
var title = "$:/config/flibbles/graph/graph/view/myview";

var wiki, log;
var engineConfig = "$:/config/flibbles/graph/engine";

beforeEach(function() {
	wiki = new $tw.Wiki();
	wiki.addTiddler({title: engineConfig, text: "Test"});
	log = spyOn(console, "log");
});

it("reports and relinks json property files", function() {
	wiki.addTiddler({
		title: title,
		type: jsonType,
		text: JSON.stringify({
			addNode: "[[cap|from here]]", addEdge: "{{from here}}" })});
	var report = wiki.getTiddlerRelinkReferences(title);
	expect(report).toEqual({"from here": ["addNode: [[cap]]","addEdge: {{}}"]});
	wiki.renameTiddler("from here", "to there");
	expect(wiki.getTiddlerData(title)).toEqual({
		addNode: "[[cap|to there]]", addEdge: "{{to there}}"});
});

it("reports and relinks dictionary property files", function() {
	wiki.addTiddler({
		title: title,
		type: dictType,
		text: "addNode: [[cap|from here]]\naddEdge: {{from here}}"});
	var report = wiki.getTiddlerRelinkReferences(title);
	expect(report).toEqual({"from here": ["addNode: [[cap]]","addEdge: {{}}"]});
	wiki.renameTiddler("from here", "to there");
	expect(wiki.getTiddlerData(title)).toEqual({
		addNode: "[[cap|to there]]", addEdge: "{{to there}}"});
});

it("relinks dictionary that need to become json", function() {
	wiki.addTiddler({
		title: title,
		type: dictType,
		text: "addNode: {{from here}}\naddEdge: X"});
	var report = wiki.getTiddlerRelinkReferences(title);
	// This is technically an illegal rename, but we'll support it anyway
	wiki.renameTiddler("from here", "to\nthere");
	expect(wiki.getTiddlerData(title)).toEqual({
		addNode: "{{to\nthere}}", addEdge: "X"});
	var fields = wiki.getTiddler(title).fields;
	expect(fields.type).toBe(jsonType);
	expect(fields.text).toBe('{\n    "addNode": "{{to\\nthere}}",\n    "addEdge": "X"\n}');
});

it("handles failed relinks and continues", function() {
	wiki.addTiddler({
		title: title,
		type: dictType,
		text: "addNode: <$text text={{from here}}/>\naddEdge: [[cap|from here]]"});
	var failures = spyOn(language, "reportFailures");
	wiki.renameTiddler("from here", "to}}there");
	expect(wiki.getTiddlerData(title)).toEqual({
		addNode: "<$text text={{from here}}/>", addEdge: "[[cap|to}}there]]"});
	expect(failures).toHaveBeenCalledTimes(1);
});

it("handles partially failed relinks", function() {
	wiki.addTiddler({
		title: title,
		type: dictType,
		text: "addNode: <$text text={{from here}}/> [[cap|from here]]"});
	var failures = spyOn(language, "reportFailures");
	wiki.renameTiddler("from here", "to}}there");
	expect(wiki.getTiddlerData(title)).toEqual({
		addNode: "<$text text={{from here}}/> [[cap|to}}there]]"});
	expect(failures).toHaveBeenCalledTimes(1);
});

it("does nothing when no engine installed", function() {
	spyOn($tw.test.utils, "getEngineMap").and.returnValue({});
	wiki.deleteTiddler(engineConfig);
	wiki.addTiddler({title: title, type: dictType, text: "addNode: {{from}}"});
	wiki.renameTiddler("from", "to");
	expect(wiki.getTiddlerText(title)).toEqual("addNode: {{from}}");
});

it("does nothing when engine incorrectly configured", function() {
	wiki.addTiddler({title: engineConfig, text: "No-exists"});
	wiki.addTiddler({title: title, type: dictType, text: "addNode: {{from}}"});
	wiki.renameTiddler("from", "to");
	expect(wiki.getTiddlerText(title)).toEqual("addNode: {{from}}");
});

it("does nothing when no specified object type", function() {
	var title = "$:/config/flibbles/graph/incomplete";
	wiki.addTiddler({title: engineConfig, text: "No-exists"});
	wiki.addTiddler({title: title, type: dictType, text: "addNode: {{from}}"});
	wiki.renameTiddler("from", "to");
	expect(wiki.getTiddlerText(title)).toEqual("addNode: {{from}}");
});

it("does nothing when outside config namespace", function() {
	var title = "$:/config/flibbles/outside/graph/view/myview";
	wiki.addTiddler({title: title, type: dictType, text: "addNode: {{from}}"});
	wiki.renameTiddler("from", "to");
	expect(wiki.getTiddlerText(title)).toEqual("addNode: {{from}}");
});

it("does nothing when dataTiddlers of unknown object types", function() {
	var title = "$:/config/flibbles/graph/unknown/view/myview";
	wiki.addTiddler({title: title, type: dictType, text: "addNode: {{from}}"});
	wiki.renameTiddler("from", "to");
	expect(wiki.getTiddlerText(title)).toEqual("addNode: {{from}}");
});

it("does nothing when dataTiddlers isn't a data tiddler", function() {
	wiki.addTiddler({title: title, type: "text/vnd.tiddlywiki", text: "addNode: {{from}}"});
	var report = wiki.getTiddlerRelinkReferences(title);
	// This will actually end up registering as a normal tiddler, so relinking
	// will still occur in this case.
	expect(report).toEqual({"from": ["{{}}"]});
	wiki.renameTiddler("from", "to");
	expect(wiki.getTiddlerText(title)).toEqual("addNode: {{to}}");
});

it("ignores properties without specified info", function() {
	wiki.addTiddler({
		title: title,
		type: dictType,
		text: "addNode: {{from}}\nwuut: {{from}}"});
	wiki.renameTiddler("from", "to");
	expect(wiki.getTiddlerData(title)).toEqual({
		addNode: "{{to}}", wuut: "{{from}}"});
});

it("ignores properties without specified relink types", function() {
	wiki.addTiddler({
		title: title,
		type: dictType,
		text: "addNode: {{from}}\nphysics: {{from}}"});
	wiki.renameTiddler("from", "to");
	expect(wiki.getTiddlerData(title)).toEqual({
		addNode: "{{to}}", physics: "{{from}}"});
});

it("ignores unknown relink types", function() {
	// This test would be better once I have more than the "actions" property
	// being relink active.
	var PropertyTypes = $tw.modules.getModulesByTypeAsHashmap("graphpropertytype");
	var oldType = PropertyTypes.actions.type;
	wiki.addTiddler({
		title: title,
		type: dictType,
		text: "addNode: {{from}}"});
	try {
		PropertyTypes.actions.type = "unknown";
		var report = wiki.getTiddlerRelinkReferences(title);
		expect(report).toEqual({});
		wiki.renameTiddler("from", "to");
		expect(wiki.getTiddlerData(title)).toEqual({
			addNode: "{{from}}"});
	} finally {
		PropertyTypes.actions.type = oldType;
	}
});

});
