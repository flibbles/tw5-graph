/*\

Tests the nodes.manipulation global widget.

\*/

describe('graph.nodelist \\widget', function() {

var wiki, update, modal, oldModal;

beforeEach(async function() {
	wiki = new $tw.Wiki();
	({update} = $tw.test.setSpies());
	await $tw.test.setGlobals(wiki);
	oldModal = $tw.modal;
	$tw.modal = modal = new $tw.utils.Modal(wiki);
	spyOn($tw.modal, "display");
});

afterEach(function() {
	$tw.modal = oldModal;
});

it("generates a modal when addNode is called", async function() {
	var text = "<$graph><$graph.nodelist $tiddler=Target $field=list/>";
	var widget = $tw.test.renderGlobal(wiki, text);
	$tw.test.dispatchEvent(wiki, {objectType: "graph", type: "addNode"}, {x: "37", y: "43"});
	expect($tw.modal.display).toHaveBeenCalled();
	$tw.rootWidget.dispatchEvent({type: "tm-modal-finish", param: "newTiddler"});
	expect(wiki.tiddlerExists("newTiddler")).toBe(true);
	expect(wiki.tiddlerExists("Target")).toBe(true);
	expect(wiki.getTiddler("Target").fields.list).toEqual(["newTiddler"]);
	await $tw.test.flushChanges();
	expect(update).toHaveBeenCalledTimes(1);
	expect(update).toHaveBeenCalledWith({nodes: {newTiddler: {}}});
});

it("works with custom content block", function() {
	wiki.addTiddler({title: "Target", list: "A B"});
	var text = "<$graph.nodelist $tiddler=Target $field=list>{{!!title}}";
	var widget = $tw.test.renderGlobal(wiki, text);
	expect(widget.parentDomNode.innerHTML).toBe("<p>AB</p>");
});

it("combining wth graph.persistent records location", async function() {
	var text = "<$graph><$graph.persistent $ledgerTiddler=Target><$graph.nodelist $tiddler=Target $field=list/>";
	var widget = $tw.test.renderGlobal(wiki, text);
	$tw.test.dispatchEvent(wiki, {objectType: "graph", type: "addNode"}, {x: "37", y: "43"});
	expect($tw.modal.display).toHaveBeenCalled();
	$tw.rootWidget.dispatchEvent({type: "tm-modal-finish", param: "newTiddler"});
	expect(wiki.tiddlerExists("newTiddler")).toBe(true);
	expect(wiki.tiddlerExists("Target")).toBe(true);
	expect(wiki.getTiddler("Target").fields.list).toEqual(["newTiddler"]);
	await $tw.test.flushChanges();
	expect(update).toHaveBeenCalledTimes(1);
	var objects = update.calls.first().args[0];
	expect(objects.nodes.newTiddler.x).toBe(37);
	expect(objects.nodes.newTiddler.y).toBe(43);
});

});
