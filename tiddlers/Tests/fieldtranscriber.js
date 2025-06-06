/*\

Tests the boundingbox widget.

\*/

describe('FieldTranscriberWidget', function() {

var wiki;
var state = "$:/temp/state";
var jsonType = "application/json";

beforeEach(function() {
	wiki = new $tw.Wiki();
});

it("manages, and defaults to, plaintext tiddlers", async function() {
	wiki.addTiddler({title: "Target", field: "first"});
	$tw.test.renderText(wiki, `<$fieldtranscriber state='${state}' tiddler=Target field=field />`);
	var stateTiddler = wiki.getTiddler(state);
	expect(stateTiddler.fields).toEqual({title: state, text: "first", type: "text/plain"});
	wiki.setText(state, "text", null, "second");
	await $tw.test.flushChanges();
	expect(wiki.getChangeCount(state)).toBe(2);
	expect(wiki.getTiddler("Target").getFieldString("field")).toBe("second");
	// Let's make sure it didn't write back to the state again
	await $tw.test.flushChanges();
	expect(wiki.getChangeCount(state)).toBe(2);
});

it("manages, and defaults to, plaintext tiddlers", async function() {
	wiki.addTiddler({title: "Target", field: "first"});
	$tw.test.renderText(wiki, `<$fieldtranscriber state='${state}' tiddler=Target field=field />`);
	var stateTiddler = wiki.getTiddler(state);
	expect(stateTiddler.fields).toEqual({title: state, text: "first", type: "text/plain"});
	wiki.setText(state, "text", null, "second");
	await $tw.test.flushChanges();
	expect(wiki.getChangeCount(state)).toBe(2);
	expect(wiki.getTiddler("Target").getFieldString("field")).toBe("second");
	// Let's make sure it didn't write back to the state again
	await $tw.test.flushChanges();
	expect(wiki.getChangeCount(state)).toBe(2);
});

it("handles unknown type", function() {
	wiki.addTiddler({title: "Target", field: "first"});
	$tw.test.renderText(wiki, `<$fieldtranscriber state='${state}' tiddler=Target type='text/unknown' field=field />`);
	var stateTiddler = wiki.getTiddler(state);
	expect(stateTiddler.fields).toEqual({title: state, text: "first", type: "text/plain"});
});

it("ignores pre-existing state", async function() {
	wiki.addTiddler({title: "Target", field: "value"});
	wiki.addTiddler({title: state, type: jsonType, text: '{\n    "key": "value"\n'});
	$tw.test.renderText(wiki, `<$fieldtranscriber tiddler=Target state='${state}' field=field />`);
	expect(wiki.getTiddler(state).fields).toEqual({title: state, type: "text/plain", text: "value"});
	wiki.setText(state, "text", null, "second");
	await $tw.test.flushChanges();
	expect(wiki.getTiddler("Target").getFieldString("field")).toBe("second");
});

it("does not write back to field when created", async function() {
	wiki.addTiddler({title: "Target", field: "first"});
	$tw.test.renderText(wiki, `<$fieldtranscriber state='${state}' tiddler=Target field=field />`);
	expect(wiki.getChangeCount("Target")).toBe(1);
	await $tw.test.flushChanges();
	expect(wiki.getChangeCount("Target")).toBe(1);
});

it("detects changes to the field", async function() {
	wiki.addTiddler({title: "Target", field: "first"});
	$tw.test.renderText(wiki, `<$fieldtranscriber state='${state}' tiddler=Target field=field />`);
	await $tw.test.flushChanges();
	expect(wiki.getTiddlerText(state)).toBe("first");
	wiki.setText("Target", "field", null, "second");
	await $tw.test.flushChanges();
	expect(wiki.getTiddlerText(state)).toBe("second");
});

it("defaults to current Tiddler for 'tiddler' field", function() {
	wiki.addTiddler({title: "Target", field: "value"});
	$tw.test.renderText(wiki, `\\define currentTiddler() Target\n<$fieldtranscriber state='${state}' field=field />`);
	expect(wiki.getTiddlerText(state)).toBe("value");
});

// May change this behavior later if I decide what it should do.
it("handles missing field attribute by doing nothing", async function() {
	var target = {title: "Target", field: "value"};
	wiki.addTiddler(target);
	$tw.test.renderText(wiki, `<$fieldtranscriber tiddler=Target state='${state}' />`);
	expect(wiki.tiddlerExists(state)).toBe(false);
	expect(wiki.getChangeCount("Target")).toBe(1);
	// Now we create a field and make sure the Target isn't touched
	wiki.setText(state, "text", null, "value");
	await $tw.test.flushChanges();
	expect(wiki.getChangeCount("Target")).toBe(1);
	expect(wiki.getTiddler("Target").fields).toEqual(target);
});

it("handles missing tiddler", async function() {
	$tw.test.renderText(wiki, `<$fieldtranscriber tiddler=Target state='${state}' field=field />`);
	expect(wiki.tiddlerExists(state)).toBe(false);
	wiki.setText(state, "text", null, "create");
	await $tw.test.flushChanges();
	expect(wiki.getTiddler("Target").fields.field).toBe("create");
});

it("handles missing field", async function() {
	wiki.addTiddler({title: "Target"});
	$tw.test.renderText(wiki, `<$fieldtranscriber tiddler=Target state='${state}' field=field />`);
	expect(wiki.tiddlerExists(state)).toBe(false);
	wiki.setText(state, "text", null, "create");
	await $tw.test.flushChanges();
	expect(wiki.getTiddler("Target").fields.field).toBe("create");
});

it("takes deletion of state as cue to delete field", async function() {
	wiki.addTiddler({title: "Target", field: "value"});
	$tw.test.renderText(wiki, `<$fieldtranscriber tiddler=Target state='${state}' field=field />`);
	wiki.deleteTiddler(state);
	await $tw.test.flushChanges();
	expect(wiki.getTiddler("Target").fields.field).toBeUndefined();
	// Setting the state back to what it was might break things
	wiki.setText(state, "text", null, "value");
	await $tw.test.flushChanges();
	expect(wiki.getTiddler("Target").fields.field).toBe("value");
});

it("takes deletion of field as cue to delete state", async function() {
	wiki.addTiddler({title: "Target", field: "value"});
	$tw.test.renderText(wiki, `<$fieldtranscriber tiddler=Target state='${state}' field=field />`);
	wiki.setText("Target", "field", null, undefined);
	await $tw.test.flushChanges();
	expect(wiki.tiddlerExists(state)).toBe(false);
	// Setting the state back to what it was might break things
	wiki.setText(state, "text", null, "value");
	await $tw.test.flushChanges();
	expect(wiki.getTiddler("Target").fields.field).toBe("value");
});

/*** Inner content ***/

it("sets a generated state variable for inner content", async function() {
	wiki.addTiddler({title: "Target", field: "myValue"});
	var widget = $tw.test.renderText(wiki, `<$fieldtranscriber tiddler=Target field=field>\n\n<$text text={{{ [<state>get[text]] }}} />\n`);
	expect(widget.parentDomNode.innerHTML).toBe("myValue");
	var states = wiki.filterTiddlers("[text[myValue]prefix[$:/temp/]]");
	expect(states.length).toBe(1);
});

it("allows children update", async function() {
	wiki.addTiddler({title: "Target", field: "myValue"});
	wiki.addTiddler({title: "Other", text: "first"});
	var widget = $tw.test.renderText(wiki, `<$fieldtranscriber tiddler=Target field=field>\n\n<$text text={{Other}} />\n`);
	expect(widget.parentDomNode.innerHTML).toBe("first");
	wiki.addTiddler({title: "Other", text: "second"});
	await $tw.test.flushChanges();
	expect(widget.parentDomNode.innerHTML).toBe("second");
});

it("handles field/tiddler conflicts with generated state", async function() {
	wiki.addTiddler({"field/value": "A", title: "target"});
	wiki.addTiddler({"field": "B", title: "value/target"});
	var widget = $tw.test.renderText(wiki, `<$fieldtranscriber field="field/value" tiddler="target">\n\n<$text text={{{ [<state>get[text]] }}} />\n\n</$fieldtranscriber><$fieldtranscriber field="field" tiddler="value/target">\n\n<$text text={{{ [<state>get[text]] }}} />\n`);
	// We give the first scribe a chance to see the second scribe's write.
	await $tw.test.flushChanges();
	expect(widget.parentDomNode.innerHTML).toBe("AB");
});

/*** JSON fields ***/

it("manages json tiddlers", async function() {
	wiki.addTiddler({title: "Target", field: '{"key":"value"}'});
	$tw.test.renderText(wiki, `<$fieldtranscriber state='${state}' tiddler=Target field=field type='application/json' />`);
	var stateTiddler = wiki.getTiddler(state);
	expect(stateTiddler.fields).toEqual({title: state, text: '{\n    "key": "value"\n}', type: jsonType});
	wiki.setText(state, "text", null, '{\n    "key": "value",\n    "also": "value"\n}');
	await $tw.test.flushChanges();
	expect(wiki.getTiddler("Target").getFieldString("field")).toBe('{"key":"value","also":"value"}');
});

// Fixes issue where JSON would mess up switching into an empty {}, where
// field and text are identical, to back to a state where pretty-printing
// makes them non-identical.
it("can toggle from empty to pretty content", async function() {
	var json = '{"key":"value"}';
	wiki.addTiddler({title: "Target", field: json});
	$tw.test.renderText(wiki, `<$fieldtranscriber state='${state}' tiddler=Target field=field type='application/json' />`);
	wiki.addTiddler({title: state, text: '{}'});
	await $tw.test.flushChanges();
	expect(wiki.getTiddler("Target").getFieldString("field")).toBe('{}');
	wiki.addTiddler({title: state, text: '{\n    "key": "value"\n}'});
	await $tw.test.flushChanges();
	expect(wiki.getTiddler("Target").getFieldString("field")).toBe(json);
});

it("json does not back write, even if it'd be different", async function() {
	wiki.addTiddler({title: "Target", field: "{    }"});
	$tw.test.renderText(wiki, `<$fieldtranscriber state='${state}' tiddler=Target field=field type='application/json' />`);
	expect(wiki.getChangeCount("Target")).toBe(1);
	await $tw.test.flushChanges();
	expect(wiki.getChangeCount("Target")).toBe(1);
});

it("broken json", async function() {
	wiki.addTiddler({title: "Target", field: '{"broken"'});
	$tw.test.renderText(wiki, `<$fieldtranscriber state='${state}' tiddler=Target field=field type='application/json' />`);
	expect(wiki.getTiddlerText(state)).toBe("{}");
	await $tw.test.flushChanges();
	// Make sure it didn't back write.
	expect(wiki.getTiddler("Target").fields.field).toBe('{"broken"');
	// Now what happens if the state gets set to something broken?
	wiki.setText(state, "text", null, '{"also broken"');
	await $tw.test.flushChanges();
	expect(wiki.getTiddler("Target").fields.field).toBe("{}");
});

/*** Common behavior across types ***/

$tw.utils.each(["application/json", "text/plain"], function(type) {

	describe("(" + type + ")", function() {

	it("handles blank fields as blank state", function() {
		wiki.addTiddler({title: "Target", field: ""});
		$tw.test.renderText(wiki, `<$fieldtranscriber tiddler=Target state='${state}' field=field type='${type}' />`);
		expect(wiki.getTiddler(state).fields.text).toBe("");
	});

	it("handles blank state as blank field", async function() {
		wiki.addTiddler({title: "Target", field: "value"});
		$tw.test.renderText(wiki, `<$fieldtranscriber tiddler=Target state='${state}' field=field type='${type}' />`);
		wiki.setText(state, "text", null, "");
		await $tw.test.flushChanges();
		expect(wiki.getTiddler("Target").fields.field).toBe("");
	});

	});

});

});
