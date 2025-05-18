/*\

Tests the boundingbox widget.

\*/

describe('FieldTranscriberWidget', function() {

var wiki;
var state = "$:/tmp/state";
var jsonType = "application/json";

beforeEach(function() {
	wiki = new $tw.Wiki();
});

it("manages, and defaults to, plaintext tiddlers", async function() {
	wiki.addTiddler({title: "Target", field: "first"});
	$tw.test.renderText(wiki, "<$fieldtranscriber state='$:/tmp/state' tiddler=Target field=field />");
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

it("does not write back to field when created", async function() {
	wiki.addTiddler({title: "Target", field: "first"});
	$tw.test.renderText(wiki, "<$fieldtranscriber state='$:/tmp/state' tiddler=Target field=field />");
	expect(wiki.getChangeCount("Target")).toBe(1);
	await $tw.test.flushChanges();
	expect(wiki.getChangeCount("Target")).toBe(1);
});

it("detects changes to the field", async function() {
	wiki.addTiddler({title: "Target", field: "first"});
	$tw.test.renderText(wiki, "<$fieldtranscriber state='$:/tmp/state' tiddler=Target field=field />");
	await $tw.test.flushChanges();
	expect(wiki.getTiddlerText(state)).toBe("first");
	wiki.setText("Target", "field", null, "second");
	await $tw.test.flushChanges();
	expect(wiki.getTiddlerText(state)).toBe("second");
});

it("defaults to current Tiddler for 'tiddler' field", function() {
	wiki.addTiddler({title: "Target", field: "value"});
	$tw.test.renderText(wiki, "\\define currentTiddler() Target\n<$fieldtranscriber state='$:/tmp/state' field=field />");
	expect(wiki.getTiddlerText(state)).toBe("value");
});

it("handles missing tiddler", async function() {
	$tw.test.renderText(wiki, "<$fieldtranscriber tiddler=Target state='$:/tmp/state' field=field />");
	expect(wiki.tiddlerExists(state)).toBe(false);
	wiki.setText(state, "text", null, "create");
	await $tw.test.flushChanges();
	expect(wiki.getTiddler("Target").fields.field).toBe("create");
});

it("handles missing field", async function() {
	wiki.addTiddler({title: "Target"});
	$tw.test.renderText(wiki, "<$fieldtranscriber tiddler=Target state='$:/tmp/state' field=field />");
	expect(wiki.tiddlerExists(state)).toBe(false);
	wiki.setText(state, "text", null, "create");
	await $tw.test.flushChanges();
	expect(wiki.getTiddler("Target").fields.field).toBe("create");
});

it("takes deletion of state as cue to delete field", async function() {
	wiki.addTiddler({title: "Target", field: "value"});
	$tw.test.renderText(wiki, "<$fieldtranscriber tiddler=Target state='$:/tmp/state' field=field />");
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
	$tw.test.renderText(wiki, "<$fieldtranscriber tiddler=Target state='$:/tmp/state' field=field />");
	wiki.setText("Target", "field", null, undefined);
	await $tw.test.flushChanges();
	expect(wiki.tiddlerExists(state)).toBe(false);
	// Setting the state back to what it was might break things
	wiki.setText(state, "text", null, "value");
	await $tw.test.flushChanges();
	expect(wiki.getTiddler("Target").fields.field).toBe("value");
});

// TODO: Blank field and state
// TODO: Missing field attribute
// TODO: Pre-existing state tiddler must be ignored

/*** JSON fields ***/

it("manages json tiddlers", async function() {
	wiki.addTiddler({title: "Target", field: '{"key":"value"}'});
	$tw.test.renderText(wiki, "<$fieldtranscriber state='$:/tmp/state' tiddler=Target field=field type='application/json' />");
	var stateTiddler = wiki.getTiddler(state);
	expect(stateTiddler.fields).toEqual({title: state, text: '{\n    "key": "value"\n}', type: jsonType});
	wiki.setText(state, "text", null, '{\n    "key": "value",\n    "also": "value"\n}');
	await $tw.test.flushChanges();
	expect(wiki.getTiddler("Target").getFieldString("field")).toBe('{"key":"value","also":"value"}');
});

it("json does not back write, even if it'd be different", async function() {
	wiki.addTiddler({title: "Target", field: "{    }"});
	$tw.test.renderText(wiki, "<$fieldtranscriber state='$:/tmp/state' tiddler=Target field=field type='application/json' />");
	expect(wiki.getChangeCount("Target")).toBe(1);
	await $tw.test.flushChanges();
	expect(wiki.getChangeCount("Target")).toBe(1);
});

it("broken json", async function() {
	wiki.addTiddler({title: "Target", field: '{"broken"'});
	$tw.test.renderText(wiki, "<$fieldtranscriber state='$:/tmp/state' tiddler=Target field=field type='application/json' />");
	expect(wiki.getTiddlerText(state)).toBe("{}");
	await $tw.test.flushChanges();
	// Make sure it didn't back write.
	expect(wiki.getTiddler("Target").fields.field).toBe('{"broken"');
	// Now what happens if the state gets set to something broken?
	wiki.setText(state, "text", null, '{"also broken"');
	await $tw.test.flushChanges();
	expect(wiki.getTiddler("Target").fields.field).toBe("{}");
});

//TODO: Empty JSON

});
