/*\

Tests the properties.configured global widget.

\*/

describe('properties.stack \\widget', function() {

var wiki, init;

beforeEach(async function() {
	wiki = new $tw.Wiki();
	({init} = $tw.test.setSpies());
	var pluginInfo = $tw.wiki.getPluginInfo("$:/plugins/flibbles/graph");
	wiki.addTiddlers(Object.values(pluginInfo.tiddlers));
	wiki.addTiddler($tw.wiki.getTiddler("$:/core/config/GlobalImportFilter"));
	// TODO: I'd love to not have to do this, but I need a getGraphObjects
	// that works and doesn't go out of date when I make core plugin changes.
	await $tw.test.flushChanges();
});

function nodeConfig(name, filter, properties) {
	return {
		title: "$:/config/flibbles/graph/nodes/stack/" + name,
		text: JSON.stringify(properties),
		filter: filter,
		type: "application/json"};
};

/*** Node stack ***/

it("applies stack in order", function() {
	wiki.addTiddlers([
		nodeConfig("typeA", "[prefix[X]]", {last: "A", value: "this"}),
		nodeConfig("typeB", "[match[X]]", {last: "B"})]);
	var text = "<$graph><$properties.configured><$list filter='X XY'><$node/>";
	var widget = $tw.test.renderGlobal(wiki, text);
	expect(init).toHaveBeenCalledTimes(1);
	expect(init.calls.first().args[1].nodes).toEqual({
		X: {last: "B", value: "this"},
		XY: {last: "A", value: "this"}});
});

it("can render inline fills", function() {
	var text = "<$properties.configured>* A\n* B";
	var widget = $tw.test.renderGlobal(wiki, text);
	var html = widget.parentDomNode.innerHTML;
	expect(html).toBe("<p>* A\n* B</p>");
});

it("can render block fills", function() {
	var text = "<$properties.configured>\n\n* A\n* B";
	var widget = $tw.test.renderGlobal(wiki, text);
	var html = widget.parentDomNode.innerHTML;
	expect(html).toBe("<ul><li>A</li><li>B</li></ul>");
});

it("does not require same output from filter to qualify", function() {
	wiki.addTiddlers([
		nodeConfig("type", "[get[field]]", {value: "assigned"}),
		{title: "X", field: "value"},
		{title: "Y"}]);
	var text = "<$graph><$properties.configured><$list filter='X Y'><$node/>";
	var widget = $tw.test.renderGlobal(wiki, text);
	expect(init).toHaveBeenCalledTimes(1);
	expect(init.calls.first().args[1].nodes).toEqual({
		X: {value: "assigned"},
		Y: {}});
});

/*** $view ***/

it("can take properties from the $view", function() {
	wiki.addTiddler({title: "View",
		"graph.nodes": '{"value": "nProp"}',
		"graph.edges": '{"value": "eProp"}',
		"graph.graph": '{"value": "gProp"}'});
	var text = "<$graph><$properties.configured $view=View><$node $tiddler=X/><$node $tiddler=Y/><$edge $from=X $to=Y/>";
	var widget = $tw.test.renderGlobal(wiki, text);
	var objects = init.calls.first().args[1];
	expect(objects.nodes).toEqual({X: {value: "nProp"}, Y: {value: "nProp"}});
	expect(objects.graph).toEqual({value: "gProp"});
	expect(Object.values(objects.edges)).toEqual([{from: "X", to: "Y", value: "eProp"}]);
});

it("without a $view, it does not default to currentTiddler", function() {
	wiki.addTiddler({title: "View",
		"graph.nodes": '{"value": "nProp"}',
		"graph.edges": '{"value": "eProp"}',
		"graph.graph": '{"value": "gProp"}'});
	var text = "<$graph><$properties.configured><$node $tiddler=X/><$node $tiddler=Y/><$edge $from=X $to=Y/>";
	var widget = $tw.test.renderGlobal(wiki, text);
	var objects = init.calls.first().args[1];
	expect(objects.nodes).toEqual({X: {}, Y: {}});
	expect(objects.graph).toEqual({});
	expect(Object.values(objects.edges)).toEqual([{from: "X", to: "Y"}]);
});

});
