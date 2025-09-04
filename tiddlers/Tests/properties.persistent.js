/*\

Tests the properties.persistent global widget.

\*/

describe('properties.persistent \\widget', function() {

var wiki, init;

var title = "$:/graph/Ledger";
var tag = "$:/tags/flibbles/graph/TiddlerData";

beforeEach(async function() {
	wiki = new $tw.Wiki();
	({init} = $tw.test.setSpies());
	await $tw.test.setGlobals(wiki);
});

it("creates ledger if it does not exist", function() {
	var text = `<$graph><$properties.persistent $dataTiddler='${title}'><$list filter=A><$node $pos=<<pos>> />`;
	var widget = $tw.test.renderGlobal(wiki, text);
	expect(init).toHaveBeenCalledTimes(1);
	var objects = init.calls.first().args[1];
	expect(objects.nodes).toEqual({A: {free: true, delete: true}});
	$tw.test.dispatchEvent(wiki, { type: "free", id: "A", objectType: "nodes"},
		{x: "29", y: "37"});
	expect(wiki.tiddlerExists(title)).toBe(true);
	expect(wiki.getTiddlerData(title)).toEqual({A: "29,37"});
	expect(wiki.getTiddlersWithTag(tag)).toEqual([]);
});

it("erases from ledger", function() {
	wiki.addTiddlers([{title: "A"}, {title: "B"}]);
	wiki.addTiddler({title:title, type: "application/x-tiddler-dictionary", text: "A: 13,17\nB: 19,23"});
	var text = `<$graph><$properties.persistent $dataTiddler='${title}'><$list filter="[[${title}]indexes[]]"><$node $pos=<<pos>> delete="<$action-deletetiddler $tiddler=<<currentTiddler>> />" />`;
	var widget = $tw.test.renderGlobal(wiki, text);
	expect(init).toHaveBeenCalledTimes(1);
	var objects = init.calls.first().args[1];
	expect(objects.nodes).toEqual({A: {free: true, delete: true, x: 13, y: 17}, B: {free: true, delete: true, x: 19, y: 23}});
	$tw.test.dispatchEvent(wiki, { type: "delete", id: "A", objectType: "nodes"});
	expect(wiki.getTiddlerData(title)).toEqual({B: "19,23"});
	expect(wiki.tiddlerExists("A")).toBe(false);
	expect(wiki.getTiddlersWithTag(tag)).toEqual([]);
});

it("reads from ledger", function() {
	wiki.addTiddler({title: title, type: "application/x-tiddler-dictionary", text: "A: 13,17"});
	var text = `<$graph><$properties.persistent $dataTiddler='${title}'><$list filter=A><$node $pos=<<pos>> />`;
	var widget = $tw.test.renderGlobal(wiki, text);
	expect(init).toHaveBeenCalledTimes(1);
	var objects = init.calls.first().args[1];
	expect(objects.nodes).toEqual({A: {free: true, delete: true, x: 13, y: 17}});
	expect(wiki.getTiddlersWithTag(tag)).toEqual([]);
});

it("does not need currentTiddler to be set to the node", function() {
	wiki.addTiddler({title: title, type: "application/json"});
	var text = `\\procedure currentTiddler() WRONG\n<$graph><$properties.persistent $dataTiddler='${title}'><$node $tiddler=A $pos=<<pos>> />`;
	var widget = $tw.test.renderGlobal(wiki, text);
	expect(init).toHaveBeenCalledTimes(1);
	var objects = init.calls.first().args[1];
	expect(objects.nodes).toEqual({A: {free: true, delete: true}});
	$tw.test.dispatchEvent(wiki, { type: "free", id: "A", objectType: "nodes"},
		{x: "29", y: "37"});
	expect(wiki.tiddlerExists(title)).toBe(true);
	expect(wiki.getTiddlerData(title)).toEqual({A: "29,37"});
	expect(wiki.getTiddlersWithTag(tag)).toEqual([]);
});

it("Adds tag if created outside of $:/graph namespace", function() {
	var text = `<$graph><$properties.persistent $dataTiddler=Ledger><$list filter=A><$node $pos=<<pos>> />`;
	var widget = $tw.test.renderGlobal(wiki, text);
	$tw.test.dispatchEvent(wiki, { type: "free", id: "A", objectType: "nodes"},
		{x: "29", y: "37"});
	expect(wiki.tiddlerExists("Ledger")).toBe(true);
	expect(wiki.getTiddlerData("Ledger")).toEqual({A: "29,37"});
	expect(wiki.getTiddlersWithTag(tag)).toEqual(["Ledger"]);
});

it("Adds tag if existing tiddler outside of $:/graph namespace", function() {
	var text = `<$graph><$properties.persistent $dataTiddler=Ledger><$list filter=A><$node $pos=<<pos>> />`;
	wiki.addTiddler({title: "Ledger", type: "application/json", tags: "Also"});
	var widget = $tw.test.renderGlobal(wiki, text);
	$tw.test.dispatchEvent(wiki, { type: "free", id: "A", objectType: "nodes"},
		{x: "29", y: "37"});
	expect(wiki.tiddlerExists("Ledger")).toBe(true);
	expect(wiki.getTiddlerData("Ledger")).toEqual({A: "29,37"});
	expect(wiki.getTiddler("Ledger").fields.tags).toEqual(["Also", tag]);
});

});
