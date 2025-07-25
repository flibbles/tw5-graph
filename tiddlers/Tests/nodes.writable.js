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
	var objects = update.calls.first().args[0];
	expect(Object.keys(objects.nodes)).toEqual(["newTiddler"]);
	expect(objects.nodes.newTiddler.delete).toBe(true);
});

it("can delete an existing node", async function() {
	wiki.addTiddler({title: "Target", list: "myNode"});
	var text = "<$graph><$nodes.writable $tiddler=Target $field=list/>";
	var widget = $tw.test.renderGlobal(wiki, text);
	$tw.test.dispatchEvent(wiki,
		{objectType: "nodes", type: "delete", id: "myNode"});
	expect(wiki.getTiddler("Target").fields.list).toBeUndefined();
});

it("works with custom content block", function() {
	wiki.addTiddler({title: "Target", list: "A B"});
	var text = "<$nodes.writable $tiddler=Target $field=list>{{!!title}}";
	var widget = $tw.test.renderGlobal(wiki, text);
	expect(widget.parentDomNode.innerHTML).toBe("<p>AB</p>");
});

it("handles different variable names", function() {
	wiki.addTiddler({title: "Target", list: "A B"});
	var text = "\\procedure currentTiddler() Current\n<$nodes.writable $tiddler=Target $field=list $variable=node>=<<currentTiddler>>-<<node>>";
	var widget = $tw.test.renderGlobal(wiki, text);
	expect(widget.parentDomNode.innerHTML).toBe("<p>=Current-A=Current-B</p>");
});

it("filters out draft tiddlers", function() {
	wiki.addTiddlers([
		{title: "Target", filter: "[tag[Nodes]]"},
		{title: "Node", tags: "Nodes"},
		{title: "Draft of 'Node'", tags: "Nodes", "draft.of": "Node", "draft.title": "Node"}]);
	var text = "<$nodes.writable $tiddler=Target $field=filter>={{!!title}}";
	var widget = $tw.test.renderGlobal(wiki, text);
	expect(widget.parentDomNode.innerHTML).toBe("<p>=Node</p>");
});

it("combining wth properties.persistent records location", async function() {
	var text = "<$graph><$properties.persistent $dataTiddler=Target><$nodes.writable $tiddler=Target $field=list/>";
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
	wiki.addTiddler({title: "Target", list: "A B"});
	var text = "<$nodes.writable $tiddler=Target>DO NOT RENDER";
	var widget = $tw.test.renderGlobal(wiki, text);
	expect(widget.parentDomNode.innerHTML).toBe("<p></p>");
});

it("integrates with properties.persistent", async function() {
	wiki.addTiddler({title: "Target", list: "A"});
	var text = "<$graph><$properties.persistent $dataTiddler=Ledger><$nodes.writable $tiddler=Target $field=list>";
	var widget = $tw.test.renderGlobal(wiki, text);
	$tw.test.dispatchEvent(wiki, {objectType: "graph", type: "addNode"}, {x: "37", y: "43"});
	expect($tw.modal.display).toHaveBeenCalled();
	$tw.rootWidget.dispatchEvent({type: "tm-modal-finish", param: "newTiddler"});
	expect(wiki.tiddlerExists("newTiddler")).toBe(true);
	expect(wiki.getTiddler("Target").fields.list).toEqual(["A", "newTiddler"]);
	expect(wiki.getTiddlerData("Ledger")).toEqual({newTiddler: "37,43"});
	await $tw.test.flushChanges();
	expect(update).toHaveBeenCalledTimes(1);
	var nodes = update.calls.first().args[0].nodes;
	expect(Object.keys(nodes)).toEqual(["newTiddler"]);
	expect(nodes.newTiddler.x).toEqual(37);
	expect(nodes.newTiddler.y).toEqual(43);
	// Now we delete it
	$tw.test.dispatchEvent(wiki, {objectType: "nodes", id: "newTiddler", type: "delete"});
	expect(wiki.getTiddler("Target").fields.list).toEqual(["A"]);
	expect(wiki.getTiddlerData("Ledger")).toEqual({});
});

});
