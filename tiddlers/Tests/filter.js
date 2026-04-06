/*\

Tests the filter property type.

This focuses in on the axis##categories property.

\*/

describe("Filter Property", function() {

var wiki, init, update, window;

beforeEach(async function() {
	wiki = new $tw.Wiki();
	({init, update, window} = $tw.test.setSpies("Also"));
	await $tw.test.setGlobals(wiki);
});

it("uses local widget state", function() {
	wiki.addTiddler({title: "Target", text: "B"});
	var widget = $tw.test.renderText(wiki, "<$graph $engine=Also><$let var={{Target}}><$axis $id=x $type=categories categories='A [<var>] C'/>");
	var objects = init.calls.first().args[1];
	expect(objects.axes.x).toEqual({categories: ["A", "B", "C"]});
});

it("can update if filter output would change", async function() {
	wiki.addTiddler({title: "Target", text: "B"});
	await $tw.test.flushChanges();
	var widget = $tw.test.renderText(wiki, "<$graph $engine=Also><$axis $id=x $type=categories categories='A [{Target}] C'/>");
	var objects = init.calls.first().args[1];
	expect(objects.axes.x).toEqual({categories: ["A", "B", "C"]});
	// Now we change it to make sure it updates
	wiki.addTiddler({title: "Target", text: "D"});
	await $tw.test.flushChanges();
	expect(update).toHaveBeenCalled();
	objects = update.calls.first().args[0];
	expect(objects.axes.x).toEqual({categories: ["A", "D", "C"]});
});

});
