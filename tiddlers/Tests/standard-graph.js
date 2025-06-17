/*\

Tests the standard-graph template

\*/

describe('standard-graph template', function() {

var wiki, init, update;

var standardGraph = "$:/plugins/flibbles/graph/templates/standard-graph";
var title = "$:/graph/test";

beforeEach(async function() {
	wiki = new $tw.Wiki();
	({init, update} = $tw.test.setSpies());
	// Spy on the modal
	oldModal = $tw.modal;
	$tw.modal = modal = new $tw.utils.Modal(wiki);
	spyOn($tw.modal, "display");
	await $tw.test.setGlobals(wiki);
});

it("physics only applies to non-recorded nodes", function() {
	wiki.addTiddlers([
		{title: title, type: "application/json", text: '{\n    "A": "4,5"\n}', filter: "A B"}]);
	var widget = $tw.test.renderGlobal(wiki, `{{${title}||${standardGraph}}}`);
	var nodes = init.calls.first().args[1].nodes;
	expect(nodes.A.physics).toBe(false);
	expect(nodes.B.physics).toBe(true);
});

it("can add and remove nodes", async function() {
	var view = {title: title, type: "application/json", text: '{}'};
	wiki.addTiddler(view);
	var widget = $tw.test.renderGlobal(wiki, `{{${title}||${standardGraph}}}`);
	$tw.test.dispatchEvent(wiki,
		{objectType: "graph", type: "addNode"},
		{x: "23", y: "29"});
	$tw.rootWidget.dispatchEvent({type: "tm-modal-finish", param: "A"});
	expect(wiki.tiddlerExists("A")).toBe(true);
	await $tw.test.flushChanges();
	expect(wiki.getTiddler(title).fields.text).toBe('{\n    "A": "23,29"\n}');
	expect(wiki.getTiddler(title).fields.filter).toBe("A");
	// Now that we've added it. Let's remove it.
	$tw.test.dispatchEvent(wiki, {objectType: "nodes", type: "delete", id:"A"});
	await $tw.test.flushChanges();
	expect(wiki.getTiddler(title).fields.text).toEqual('{}');
	expect(wiki.getTiddler(title).fields.filter).toBeUndefined();
});

});
