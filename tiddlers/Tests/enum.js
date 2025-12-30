/*\

Tests the enum property type.

This focuses in on the nodes##shape property, which shoudl have properties:

   circle
   deprecated (this is hidden)

\*/

describe("Enum Property", function() {

var wiki, init, update, window;

beforeEach(async function() {
	wiki = new $tw.Wiki();
	({init, update, window} = $tw.test.setSpies());
	await $tw.test.setGlobals(wiki);
});

it("ignores non-existent options", function() {
	var widget = $tw.test.renderText(wiki, "<$graph><$node $tiddler=A shape=nonexistent />");
	var objects = init.calls.first().args[1];
	expect(objects.nodes).toEqual({A: {}});
});

it("does allow for deprecated or hidden options", function() {
	var widget = $tw.test.renderText(wiki, "<$graph><$node $tiddler=A shape=deprecated />");
	var objects = init.calls.first().args[1];
	expect(objects.nodes).toEqual({A: {shape: "deprecated"}});
});

it("does not show deprecated or hidden options in dropdowns", function() {
	var widget = $tw.test.renderText(wiki, "{{$:/plugins/flibbles/graph/ui/ViewTemplate/properties|nodes}}");
	var html = widget.parentDomNode.innerHTML;
	// Make sure some shapes are showing up somewhere
	expect(html).toContain("circle");
	// But make sure deprecated doesn't appear
	expect(html).not.toContain("deprecated");
});

});
