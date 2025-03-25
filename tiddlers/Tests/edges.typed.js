/*\

Tests the edges.typed global widget.

\*/

describe('edges.typed \\widget', function() {

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

function relinkConfig(name, type) {
	return {title: "$:/config/flibbles/relink/fields/" + name, text: type};
};

function  edgeConfig(name, properties) {
	return {
		title: "$:/config/flibbles/graph/edges/" + name,
		text: JSON.stringify(properties),
		type: "application/json"};
};

function nodesFor() {
	return Array.prototype.map.call(arguments, x => `<$node $tiddler="${x}"/>`).join("");
};

it("handles edges with different fieldTypes", function() {
	wiki.addTiddlers([
		edgeConfig("fieldA", {value: "A"}),
		edgeConfig("fieldB", {value: "B"}),
		relinkConfig("fieldA", "title"),
		{title: "from", fieldA: "to this", fieldB: "to this"}]);
	var text = "<$graph><$edges.typed $tiddler=from/>" + nodesFor("from", "to", "this", "to this");
	var widget = $tw.test.renderGlobal(wiki, text);
	expect(init).toHaveBeenCalledTimes(1);
	var objects = init.calls.first().args[1];
	expect(Object.values(objects.edges)).toEqual([
		{from: "from", to: "to this", value: "A"},
		{from: "from", to: "to", value: "B"},
		{from: "from", to: "this", value: "B"}]);
});

});
