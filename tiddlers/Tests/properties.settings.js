/*\

Tests the properties.settings global widget.

\*/

describe('properties.settings \\widget', function() {

var wiki, init, update;
var stackPrefix = "$:/config/flibbles/graph/nodes/stack/";

beforeEach(async function() {
	wiki = new $tw.Wiki();
	({init, update} = $tw.test.setSpies());
	await $tw.test.setGlobals(wiki);
});

function nodeConfig(name, filter, properties) {
	return {
		title: stackPrefix + name,
		text: JSON.stringify(properties),
		filter: filter,
		type: "application/json"};
};

it("can take properties from the view", function() {
	wiki.addTiddler({title: "View",
		"graph.nodes": '{"value": "nProp"}',
		"graph.edges": '{"value": "eProp"}',
		"graph.graph": '{"value": "gProp"}'});
	var text = "<$let currentTiddler=View><$graph><$properties.settings><$node $tiddler=X/><$node $tiddler=Y/><$edge $from=X $to=Y/>";
	var widget = $tw.test.renderGlobal(wiki, text);
	var objects = init.calls.first().args[1];
	expect(objects.nodes).toEqual({X: {value: "nProp"}, Y: {value: "nProp"}});
	expect(objects.graph.value).toBe("gProp");
	expect(Object.values(objects.edges)).toEqual([{from: "X", to: "Y", value: "eProp"}]);
});

it("passes edge settings to internal $edges.typed", function() {
	wiki.addTiddlers([
		{title: "root", tags: "A", list: "B", text: "[[C]] {{D}}"},
		{title: "View", "edges.fields": "tags", "edges.formulas": "links"}]);
	var text = "<$let currentTiddler=View><$graph><$properties.settings><$edges.typed $tiddler=root><<toTiddler>>-";
	var widget = $tw.test.renderGlobal(wiki, text);
	expect(widget.parentDomNode.textContent).toBe("A-C-");
});

});
