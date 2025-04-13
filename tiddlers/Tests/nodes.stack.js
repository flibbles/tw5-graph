/*\

Tests the edges.fields global widget.

\*/

describe('nodes.stack \\widget', function() {

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

it("applies stack in order", function() {
	wiki.addTiddlers([
		nodeConfig("typeA", "[prefix[X]]", {last: "A", value: "this"}),
		nodeConfig("typeB", "[match[X]]", {last: "B"})]);
	var text = "<$graph><$nodes.stack><$list filter='X XY'><$node/>";
	var widget = $tw.test.renderGlobal(wiki, text);
	expect(init).toHaveBeenCalledTimes(1);
	expect(init.calls.first().args[1].nodes).toEqual({
		X: {last: "B", value: "this"},
		XY: {last: "A", value: "this"}});
});

it("can render inline fills", function() {
	var text = "<$nodes.stack>* A\n* B";
	var widget = $tw.test.renderGlobal(wiki, text);
	var html = widget.parentDomNode.innerHTML;
	expect(html).toBe("<p>* A\n* B</p>");
});

it("can render block fills", function() {
	var text = "<$nodes.stack>\n\n* A\n* B";
	var widget = $tw.test.renderGlobal(wiki, text);
	var html = widget.parentDomNode.innerHTML;
	expect(html).toBe("<ul><li>A</li><li>B</li></ul>");
});

});
