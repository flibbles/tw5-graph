/*\

Tests the nodes.manipulation global widget.

\*/

describe('nodes.writable \\widget', function() {

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
	var text = "<$graph><$nodes.writable $tiddler=Target $field=list/>";
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
	var text = "<$nodes.writable $tiddler=Target $field=list>{{!!title}}";
	var widget = $tw.test.renderGlobal(wiki, text);
	expect(widget.parentDomNode.innerHTML).toBe("<p>AB</p>");
});

it("combining wth graph.persistent records location", async function() {
	var text = "<$graph><$graph.persistent $dataTiddler=Target><$nodes.writable $tiddler=Target $field=list/>";
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

it("without $field, only takes care of creation and position", function() {
	var text = "\\procedure recordPosition(title) <$action-test title />\n<$graph><$nodes.writable />";
	var widget = $tw.test.renderGlobal(wiki, text);
	$tw.test.dispatchEvent(wiki, {objectType: "graph", type: "addNode"}, {x: "37", y: "43"});
	expect($tw.modal.display).toHaveBeenCalled();
	$tw.rootWidget.dispatchEvent({type: "tm-modal-finish", param: "newTiddler"});
	expect(wiki.tiddlerExists("newTiddler")).toBe(true);
	expect($tw.test.actionMethod).toHaveBeenCalledWith({title: "newTiddler"});
});

it("without $field, does not render its block", function() {
	var text = "<$nodes.writable >DO NOT RENDER";
	var widget = $tw.test.renderGlobal(wiki, text);
	expect(widget.parentDomNode.innerHTML).toBe("<p></p>");
});

});
