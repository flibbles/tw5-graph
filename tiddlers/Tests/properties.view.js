/*\

Tests the properties.view global widget.

\*/

describe('properties.view \\widget', function() {

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
	var text = "<$let currentTiddler=View><$graph><$properties.view><$node $tiddler=X/><$node $tiddler=Y/><$edge $from=X $to=Y/>";
	var widget = $tw.test.renderGlobal(wiki, text);
	var objects = init.calls.first().args[1];
	expect(objects.nodes).toEqual({X: {value: "nProp"}, Y: {value: "nProp"}});
	expect(objects.graph.value).toBe("gProp");
	expect(Object.values(objects.edges)).toEqual([{from: "X", to: "Y", value: "eProp"}]);
});

});
