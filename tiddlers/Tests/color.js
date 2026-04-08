/*\

Tests the color property type.

This focuses in on the nodes##color property

\*/

describe("Color Property", function() {

var wiki, init, update, makeWidget, window;

const prefix = '\\define colour(name) <$transclude $tiddler="$name$"/>\n';

beforeEach(async function() {
	wiki = new $tw.Wiki();
	({init, update, window} = $tw.test.setSpies());
	makeWidget = spyOn(wiki, "makeWidget").and.callThrough();
	await $tw.test.setGlobals(wiki);
});

it("treats empty string as a non-value", function() {
	var widget = $tw.test.renderText(wiki, "<$graph><$properties color=#aa0000><$node $tiddler=A color='' />");
	var objects = init.calls.first().args[1];
	expect(objects.nodes).toEqual({A: {color: "#aa0000"}});
});

it("empty string does not create a dummy widget", function() {
	var widget = $tw.test.renderText(wiki, "<$vars colour=dummy><$graph><$node $tiddler=A color='' />");
	var objects = init.calls.first().args[1];
	// "dummy" should not show up, which is what the widget would return always
	// even if the value is an empty string.
	expect(objects.nodes).toEqual({A: {}});
});

it("works with #xxxxxx color format", async function() {
	wiki.addTiddler({title: "Elsewise", text: "this"});
	await $tw.test.flushChanges();
	var widget = $tw.test.renderText(wiki, "<$graph><$node $tiddler=A color=#ff0000 />");
	var objects = init.calls.first().args[1];
	expect(objects.nodes).toEqual({A: {color: "#ff0000"}});
	// We make sure that refreshing #colors is a successful no-op operation
	wiki.addTiddler({title: "Elsewise", text: "that"});
	await $tw.test.flushChanges();
	expect(objects.nodes).toEqual({A: {color: "#ff0000"}});
});

it("works with palette colors", async function() {
	wiki.addTiddler({title: "graph-node-color", text: "#330000"});
	await $tw.test.flushChanges();
	var widget = $tw.test.renderText(wiki, prefix + "<$graph><$node $tiddler=A color=graph-node-color />");
	var objects = init.calls.first().args[1];
	// We'll have made one dummy widget for this
	expect(makeWidget).toHaveBeenCalled();
	makeWidget.calls.reset();
	expect(objects.nodes).toEqual({A: {color: "#330000"}});
	// And if we change it, that gets detected
	wiki.addTiddler({title: "graph-node-color", text: "#660000"});
	await $tw.test.flushChanges();
	expect(objects.nodes).toEqual({A: {color: "#660000"}});
	// Let's make sure we're using the dummy widgets we already have
	expect(makeWidget).not.toHaveBeenCalled();
});

it("can switch to palette colors", async function() {
	wiki.addTiddler({title: "graph-node-color", text: "#330000"});
	wiki.addTiddler({title: "Color", text: "#aa0000"});
	await $tw.test.flushChanges();
	var widget = $tw.test.renderText(wiki, prefix + "<$graph><$node $tiddler=A color={{Color}} />");
	var objects = init.calls.first().args[1];
	expect(objects.nodes).toEqual({A: {color: "#aa0000"}});
	// And if we change it, that gets detected
	wiki.addTiddler({title: "Color", text: "graph-node-color"});
	await $tw.test.flushChanges();
	expect(objects.nodes).toEqual({A: {color: "#330000"}});
});

it("can switch from palette colors", async function() {
	wiki.addTiddler({title: "graph-node-color", text: "#330000"});
	wiki.addTiddler({title: "Color", text: "graph-node-color"});
	await $tw.test.flushChanges();
	var widget = $tw.test.renderText(wiki, prefix + "<$graph><$node $tiddler=A color={{Color}} />");
	var objects = init.calls.first().args[1];
	expect(objects.nodes).toEqual({A: {color: "#330000"}});
	// And if we change it, that gets detected
	wiki.addTiddler({title: "Color", text: "#bb0000"});
	await $tw.test.flushChanges();
	expect(objects.nodes).toEqual({A: {color: "#bb0000"}});
	// Now updating the palette color triggers no refresh
	update.calls.reset();
	wiki.addTiddler({title: "graph-node-color", text: "#330000"});
	await $tw.test.flushChanges();
	expect(update).not.toHaveBeenCalled();
});

it("works with css color names", async function() {
	await $tw.test.flushChanges();
	var widget = $tw.test.renderText(wiki, prefix + "<$graph><$node $tiddler=A color=brickred />");
	var objects = init.calls.first().args[1];
	// We'll have made one dummy widget for this
	expect(makeWidget).toHaveBeenCalled();
	makeWidget.calls.reset();
	expect(objects.nodes).toEqual({A: {color: "brickred"}});
	// And if we change it, that gets detected
	wiki.addTiddler({title: "brickred", text: "#770000"});
	await $tw.test.flushChanges();
	expect(objects.nodes).toEqual({A: {color: "#770000"}});
	// Let's make sure we're using the dummy widgets we already have
	expect(makeWidget).not.toHaveBeenCalled();
	// Let's switch back to blank
	wiki.deleteTiddler("brickred");
	await $tw.test.flushChanges();
	expect(objects.nodes).toEqual({A: {color: "brickred"}});
	expect(makeWidget).not.toHaveBeenCalled();
});

it("uses scope local to the widget", async function() {
	wiki.addTiddler({title: "graph-node-color", text: "#330000"});
	await $tw.test.flushChanges();
	var widget = $tw.test.renderText(wiki, prefix + "<$graph><$properties color=graph-node-color><$node $tiddler=A /><$vars colour=#00aa00><$node $tiddler=B />");
	var objects = init.calls.first().args[1];
	expect(objects.nodes).toEqual({A: {color: "#330000"}, B: {color: "#00aa00"}});
	// Now change the palette and make sure only one changes
	wiki.addTiddler({title: "graph-node-color", text: "#440000"});
	await $tw.test.flushChanges();
	var objects = update.calls.first().args[0];
	expect(objects.nodes).toEqual({A: {color: "#440000"}});
});

});
