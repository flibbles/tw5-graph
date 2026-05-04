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

it("updates correctly on graph objects", async function() {
	wiki.addTiddler({title: "graph-border", text: "#ffffff"});
	await $tw.test.flushChanges();
	var widget = $tw.test.renderText(wiki, prefix + "<$graph border=graph-border />");
	// We'll have made one dummy widget for this
	expect(makeWidget).toHaveBeenCalled();
	makeWidget.calls.reset();
	expect(init.calls.first().args[1].graph).toEqual({border: "#ffffff"});
	// And if we change it, that gets detected
	wiki.addTiddler({title: "graph-border", text: "#ff0000"});
	await $tw.test.flushChanges();
	expect(update.calls.first().args[0]).toEqual({graph: {border: "#ff0000"}});
	// Let's make sure we're using the dummy widgets we already have
	expect(makeWidget).not.toHaveBeenCalled();
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

it("can switch to palette colors not named as CSS colors", async function() {
	await $tw.test.flushChanges();
	// We have a non-color value which doesn't match a palette color, nothing.
	var widget = $tw.test.renderText(wiki, prefix + "<$graph><$node $tiddler=A color=notacolor />");
	expect(init.calls.first().args[1].nodes).toEqual({A: {}});
	// If we change it so such a palette color exists
	wiki.addTiddler({title: "notacolor", text: "#aa0000"});
	await $tw.test.flushChanges();
	expect(update.calls.first().args[0].nodes).toEqual({A: {color: "#aa0000"}});
	// If we change it to a color, it detects and updates
	update.calls.reset();
	wiki.deleteTiddler("notacolor");
	await $tw.test.flushChanges();
	expect(update.calls.first().args[0].nodes).toEqual({A: {}});
});

it("can switch to palette colors named as CSS colors", async function() {
	await $tw.test.flushChanges();
	var widget = $tw.test.renderText(wiki, prefix + "<$graph><$node $tiddler=A color=red />");
	expect(init.calls.first().args[1].nodes).toEqual({A: {color: "red"}});
	// And if we change it, that gets detected
	wiki.addTiddler({title: "red", text: "#222222"});
	await $tw.test.flushChanges();
	expect(update.calls.first().args[0].nodes).toEqual({A: {color: "#222222"}});
	// If we change it to a color, it detects and updates
	update.calls.reset();
	wiki.deleteTiddler("red");
	await $tw.test.flushChanges();
	expect(update.calls.first().args[0].nodes).toEqual({A: {color: "red"}});
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
	var widget = $tw.test.renderText(wiki, prefix + "<$graph><$node $tiddler=A color=red />");
	var objects = init.calls.first().args[1];
	// We'll have made one dummy widget for this
	expect(makeWidget).toHaveBeenCalled();
	makeWidget.calls.reset();
	expect(objects.nodes).toEqual({A: {color: "red"}});
	// And if we change it, that gets detected
	wiki.addTiddler({title: "red", text: "#770000"});
	await $tw.test.flushChanges();
	expect(objects.nodes).toEqual({A: {color: "#770000"}});
	// Let's make sure we're using the dummy widgets we already have
	expect(makeWidget).not.toHaveBeenCalled();
	// Let's switch back to blank
	wiki.deleteTiddler("red");
	await $tw.test.flushChanges();
	expect(objects.nodes).toEqual({A: {color: "red"}});
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

// Two objects with the same ID can result in one getting toProperty'ed, but
// not the other, which can cause a refresh to fail if toProperty makes stuff
it("can handle overlapping nodes", async function() {
	wiki.addTiddler({title: "graph-node-color", text: "#330000"});
	wiki.addTiddler({title: "Toggle", text: "yes"});
	await $tw.test.flushChanges();
	var widget = $tw.test.renderText(wiki, prefix + "<$graph><$properties color=graph-node-color><$node $tiddler=A color=graph-node-color/><%if [{Toggle}match[yes]] %><$node $tiddler=A color=#555555/>");
	var objects = init.calls.first().args[1];
	expect(objects.nodes).toEqual({A: {color: "#555555"}});
	// Now change something
	wiki.addTiddler({title: "Toggle", text: "no"});
	await $tw.test.flushChanges();
	objects = update.calls.first().args[0];
	expect(objects.nodes).toEqual({A: {color: "#330000"}});
});

// Having a color cache from unrelated properties may cause a crash on refresh
// if only those unrelated properties are cached.
it("won't crash if trying to read non-existent color", async function() {
	var spies = $tw.test.spyOnAdapter("Also");
	spies.testRules("graph", {
		color: {type: "color"},
		test: {type: "test"}
	});
	var w = $tw.test.renderText(wiki, "<$graph $engine=Also test=color />");
	expect(spies.init).toHaveBeenCalled();
	wiki.addTiddler({title: "Literally anything at all"});
	await $tw.test.flushChanges();
	expect(spies.update).not.toHaveBeenCalled();
});

// Having a color cache from unrelated properties may cause a crash on refresh
// if only those unrelated properties are cached.
// This can happen with images refreshing colors they may not have initialized.
it("won't crash from a shared color cache", async function() {
	var spies = $tw.test.spyOnAdapter("Also");
	spies.testRules("graph", {
		color: {type: "color", default: "blue"},
		other: {type: "color"},
		test: {type: "test", only: "refresh"}
	});
	var w = $tw.test.renderText(wiki, "<$graph $engine=Also other=red test=color />");
	expect(spies.init).toHaveBeenCalled();
	wiki.addTiddler({title: "Literally anything at all"});
	await $tw.test.flushChanges();
	expect(spies.update).not.toHaveBeenCalled();
})

// Found a crash. Even if this only happens if an engine is made wrong
it("no crash with default non-string", function() {
	var spies = $tw.test.spyOnAdapter("Also");
	spies.testRules("graph", {
		color: {type: "color", always: true, default: 0},
		font: {type: "color", always: true, default: "#0"}
	});
	// In Test, the nodeColor property is tied to graph-node-color palette
	$tw.test.renderText(wiki, "<$graph $engine=Also />")
	var initialObjects = spies.init.calls.first().args[1];
	expect(initialObjects).toEqual({graph: {font: "#0"}});
});

});
