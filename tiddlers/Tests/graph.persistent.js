/*\

Tests the edges.fields global widget.

\*/

describe('graph.persistent \\widget', function() {

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

it("creates ledger if it does not exist", function() {
	var text = "<$graph><$graph.persistent $ledgerTiddler=Ledger><$list filter=A><$node $pos=<<pos>> />";
	var widget = $tw.test.renderGlobal(wiki, text);
	expect(init).toHaveBeenCalledTimes(1);
	var objects = init.calls.first().args[1];
	expect(objects.nodes).toEqual({A: {free: true}});
	$tw.test.dispatchEvent(wiki, { type: "free", id: "A", objectType: "nodes"},
		{x: "29", y: "37"});
	expect(wiki.tiddlerExists("Ledger")).toBe(true);
	expect(wiki.getTiddlerData("Ledger")).toEqual({A: "29,37"});
});

it("reads from ledger", function() {
	wiki.addTiddler({title: "Ledger", type: "application/x-tiddler-dictionary", text: "A: 13,17"});
	var text = "<$graph><$graph.persistent $ledgerTiddler=Ledger><$list filter=A><$node $pos=<<pos>> />";
	var widget = $tw.test.renderGlobal(wiki, text);
	expect(init).toHaveBeenCalledTimes(1);
	var objects = init.calls.first().args[1];
	expect(objects.nodes).toEqual({A: {free: true, x: 13, y: 17}});
});

});
