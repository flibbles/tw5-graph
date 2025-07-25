/*\

Tests the properties.persistent global widget.

\*/

describe('properties.persistent \\widget', function() {

var wiki, init;

beforeEach(async function() {
	wiki = new $tw.Wiki();
	({init} = $tw.test.setSpies());
	await $tw.test.setGlobals(wiki);
});

it("creates ledger if it does not exist", function() {
	var text = "<$graph><$properties.persistent $dataTiddler=Ledger><$list filter=A><$node $pos=<<pos>> />";
	var widget = $tw.test.renderGlobal(wiki, text);
	expect(init).toHaveBeenCalledTimes(1);
	var objects = init.calls.first().args[1];
	expect(objects.nodes).toEqual({A: {free: true, delete: true}});
	$tw.test.dispatchEvent(wiki, { type: "free", id: "A", objectType: "nodes"},
		{x: "29", y: "37"});
	expect(wiki.tiddlerExists("Ledger")).toBe(true);
	expect(wiki.getTiddlerData("Ledger")).toEqual({A: "29,37"});
});

it("erases from ledger", function() {
	wiki.addTiddlers([{title: "A"}, {title: "B"}]);
	wiki.addTiddler({title: "Ledger", type: "application/x-tiddler-dictionary", text: "A: 13,17\nB: 19,23"});
	var text = '<$graph><$properties.persistent $dataTiddler=Ledger><$list filter="[[Ledger]indexes[]]"><$node $pos=<<pos>> delete="<$action-deletetiddler $tiddler=<<currentTiddler>> />" />';
	var widget = $tw.test.renderGlobal(wiki, text);
	expect(init).toHaveBeenCalledTimes(1);
	var objects = init.calls.first().args[1];
	expect(objects.nodes).toEqual({A: {free: true, delete: true, x: 13, y: 17}, B: {free: true, delete: true, x: 19, y: 23}});
	$tw.test.dispatchEvent(wiki, { type: "delete", id: "A", objectType: "nodes"});
	expect(wiki.getTiddlerData("Ledger")).toEqual({B: "19,23"});
	expect(wiki.tiddlerExists("A")).toBe(false);
});

it("reads from ledger", function() {
	wiki.addTiddler({title: "Ledger", type: "application/x-tiddler-dictionary", text: "A: 13,17"});
	var text = "<$graph><$properties.persistent $dataTiddler=Ledger><$list filter=A><$node $pos=<<pos>> />";
	var widget = $tw.test.renderGlobal(wiki, text);
	expect(init).toHaveBeenCalledTimes(1);
	var objects = init.calls.first().args[1];
	expect(objects.nodes).toEqual({A: {free: true, delete: true, x: 13, y: 17}});
});

it("does not need currentTiddler to be set to the node", function() {
	wiki.addTiddler({title: "Ledger", type: "application/json"});
	var text = "\\procedure currentTiddler() WRONG\n<$graph><$properties.persistent $dataTiddler=Ledger><$node $tiddler=A $pos=<<pos>> />";
	var widget = $tw.test.renderGlobal(wiki, text);
	expect(init).toHaveBeenCalledTimes(1);
	var objects = init.calls.first().args[1];
	expect(objects.nodes).toEqual({A: {free: true, delete: true}});
	$tw.test.dispatchEvent(wiki, { type: "free", id: "A", objectType: "nodes"},
		{x: "29", y: "37"});
	expect(wiki.tiddlerExists("Ledger")).toBe(true);
	expect(wiki.getTiddlerData("Ledger")).toEqual({A: "29,37"});
});

});
