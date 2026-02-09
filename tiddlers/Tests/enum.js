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

it("allows enums with spaces", function() {
	var widget = $tw.test.renderText(wiki, "<$graph><$node $tiddler=A shape='big circle' /><$node $tiddler=B /><$edge $id=AB $from=A $to=B arrows='[[also this]]' />");
	var objects = init.calls.first().args[1];
	expect(objects.nodes.A).toEqual({shape: "big circle"});
	expect(objects.edges).toEqual({AB: {from: "A", to: "B", arrows: ["also this"]}});
});

it("allows a single space enum for back-compat reasons", function() {
	var widget = $tw.test.renderText(wiki, "<$graph><$node $tiddler=A shape=' '/><$node $tiddler=B/><$edge $id=AB $from=A $to=B arrows=' ' />");
	var objects = init.calls.first().args[1];
	expect(objects.nodes.A).toEqual({shape: " "});
	expect(objects.edges).toEqual({AB: {from: "A", to: "B", arrows: []}});
});

it("ignores non-existent options", function() {
	var widget = $tw.test.renderText(wiki, "<$graph><$node $tiddler=A shape=nonexistent /><$node $tiddler=B/><$edge $id=AB $from=A $to=B arrows=nonexistent />");
	var objects = init.calls.first().args[1];
	expect(objects.nodes).toEqual({A: {}, B: {}});
	// It's a multiple, but without any valid values, we ignored it entirely
	expect(objects.edges).toEqual({AB: {from: "A", to: "B"}});
});

it("does allow for deprecated or hidden options", function() {
	var widget = $tw.test.renderText(wiki, "<$graph><$node $tiddler=A shape=deprecated /><$node $tiddler=B/><$edge $id=AB $from=A $to=B arrows=deprecated />");
	var objects = init.calls.first().args[1];
	expect(objects.nodes).toEqual({A: {shape: "deprecated"}, B: {}});
	expect(objects.edges).toEqual({AB: {from: "A", to: "B", arrows: ["deprecated"]}});
});

/*** Single value enums ***/

it("does not show hidden options in Single dropdowns", function() {
	var widget = $tw.test.renderText(wiki, "{{$:/plugins/flibbles/graph/ui/ViewTemplate/properties|nodes}}");
	var html = widget.parentDomNode.innerHTML;
	// Make sure some shapes are showing up somewhere
	expect(html).toContain("circle");
	// But make sure deprecated doesn't appear
	expect(html).not.toContain("deprecated");
});

it("Single can have a default value with spaces", function() {
	var widget = $tw.test.renderText(wiki, "{{$:/plugins/flibbles/graph/ui/ViewTemplate/properties|nodes}}");
	var select = [];
	// Dig through the tree and find all select option elements
	function findSelectElement(root) {
		if (root.tag === "select") {
			select.push(root.value);
		}
		root.children && root.children.forEach(findSelectElement);
	};
	findSelectElement(widget.parentDomNode);
	expect(select).toEqual(["big circle"]);
});

/*** Multiple value enums ***/

it("can allow multiple enums when specified", function() {
	var widget = $tw.test.renderText(wiki, "<$graph><$node $tiddler=A/><$node $tiddler=B/><$edge $id=AB $from=A $to=B arrows='to ignore from' />");
	var objects = init.calls.first().args[1];
	expect(objects.edges).toEqual({AB: {from: "A", to: "B", arrows: ["to", "from"]}});
});

it("does not show hidden options in Multiple dropdowns", function() {
	var widget = $tw.test.renderText(wiki, "{{$:/plugins/flibbles/graph/ui/ViewTemplate/properties|edges}}");
	var html = widget.parentDomNode.innerHTML;
	// Make sure some shapes are showing up somewhere
	expect(html).toContain("from");
	// But make sure deprecated doesn't appear
	expect(html).not.toContain("deprecated");
});

it("Multiple can have a default value with spaces", function() {
	var widget = $tw.test.renderText(wiki, "{{$:/plugins/flibbles/graph/ui/ViewTemplate/properties|edges}}");
	var selected = [];
	// Dig through the tree and find all selected option elements
	function findSelected(root) {
		if (root.tag === "option" && root.selected) {
			selected.push(root.value);
		}
		root.children && root.children.forEach(findSelected);
	};
	findSelected(widget.parentDomNode);
	expect(selected).toEqual(["to", "also this"]);
});

});
