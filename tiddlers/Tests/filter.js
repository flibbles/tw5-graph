/*\

Tests the filter property type.

This focuses in on the axis##categories property.

\*/

describe("Filter Property", function() {

var wiki, init, update, window;

beforeEach(async function() {
	wiki = new $tw.Wiki();
	spies = $tw.test.setSpies("Also");
	spies.testRules("nodes", {
		filt: {type: "filter"}
	});
	({init, update, window} = spies);
	await $tw.test.setGlobals(wiki);
});

it("uses local widget state", function() {
	wiki.addTiddler({title: "Target", text: "B"});
	var widget = $tw.test.renderText(wiki, "<$graph $engine=Also><$let var={{Target}}><$node $tiddler=x filt='A [<var>] C'/>");
	var objects = init.calls.first().args[1];
	expect(objects.nodes.x).toEqual({filt: ["A", "B", "C"]});
});

it("can access currentTiddler", function() {
	wiki.addTiddler({title: "Target", text: "currentText"});
	var widget = $tw.test.renderText(wiki, "<$tiddler tiddler=Target><$graph $engine=Also><$node $tiddler=x filt='A [{!!text}] C'/>");
	var objects = init.calls.first().args[1];
	expect(objects.nodes.x).toEqual({filt: ["A", "currentText", "C"]});
});

it("can be assigned by properties widgets", async function() {
	wiki.addTiddlers([
		{title: "Outer", text: "Outer"},
		{title: "Inner", text: "Inner"}]);
	await $tw.test.flushChanges();
	var widget = $tw.test.renderText(wiki, "<$vars val=Outer><$graph $engine=Also><$properties filt='[<val>get[text]]'><$vars val=Inner><$node $tiddler=x />");
	var objects = init.calls.first().args[1];
	// We use the $properties value, but evaluated with the state of the axis
	expect(objects.nodes.x).toEqual({filt: ['Inner']});
	wiki.addTiddler({title: "Outer", text: "Changed"});
	await $tw.test.flushChanges();
	// Changing the outer variable value
	expect(update).not.toHaveBeenCalled();
});

it("treats empty formulas as non-properties", function() {
	var widget = $tw.test.renderText(wiki, "<$graph $engine=Also><$properties filt=Original><$node $tiddler=x filt='' />");
	var objects = init.calls.first().args[1];
	expect(objects.nodes.x).toEqual({filt: ['Original']});
});

it("treats empty outputs as valid properties", function() {
	var widget = $tw.test.renderText(wiki, "<$graph $engine=Also><$properties filt=Original><$node $tiddler=x filt='[[C]match[A]]' />");
	var objects = init.calls.first().args[1];
	expect(objects.nodes.x).toEqual({filt: []});
});

it("can update if filter output would change", async function() {
	wiki.addTiddler({title: "Target", text: "B"});
	await $tw.test.flushChanges();
	var widget = $tw.test.renderText(wiki, "<$graph $engine=Also><$node $tiddler=x filt='A [{Target}] C'/>");
	var objects = init.calls.first().args[1];
	expect(objects.nodes.x).toEqual({filt: ["A", "B", "C"]});
	// Now we change it to make sure it updates
	wiki.addTiddler({title: "Target", text: "D"});
	await $tw.test.flushChanges();
	expect(update).toHaveBeenCalled();
	objects = update.calls.first().args[0];
	expect(objects.nodes.x).toEqual({filt: ["A", "D", "C"]});
});

it("does not update if nothing changed", async function() {
	wiki.addTiddler({title: "Target", text: "B"});
	await $tw.test.flushChanges();
	var widget = $tw.test.renderText(wiki, "<$graph $engine=Also><$node $tiddler=x filt='A [{Target}] C'/>");
	var objects = init.calls.first().args[1];
	expect(objects.nodes.x).toEqual({filt: ["A", "B", "C"]});
	// Now we change the target tiddler, but not in a way that changes input
	wiki.addTiddler({title: "Target", text: "B", tags: "Added"});
	await $tw.test.flushChanges();
	expect(update).not.toHaveBeenCalled();
});

});
