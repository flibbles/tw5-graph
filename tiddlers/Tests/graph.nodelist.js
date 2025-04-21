/*\

Tests the nodes.manipulation global widget.

\*/

describe('graph.nodelist \\widget', function() {

var wiki, modal, oldModal;

beforeEach(async function() {
	wiki = new $tw.Wiki();
	$tw.test.setSpies();
	await $tw.test.setGlobals(wiki);
	oldModal = $tw.modal;
	$tw.modal = modal = new $tw.utils.Modal(wiki);
	spyOn($tw.modal, "display");
});

afterEach(function() {
	$tw.modal = oldModal;
});

it("generates a modal when addNode is called", function() {
	var text = "<$graph><$graph.nodelist $tiddler=Target $field=list>";
	var widget = $tw.test.renderGlobal(wiki, text);
	$tw.test.dispatchEvent(wiki, {objectType: "graph", type: "addNode"}, {x: "37", y: "43"});
	expect($tw.modal.display).toHaveBeenCalled();
	$tw.rootWidget.dispatchEvent({type: "tm-modal-finish", param: "newTiddler"});
	expect(wiki.tiddlerExists("Target")).toBe(true);
	expect(wiki.tiddlerExists("newTiddler")).toBe(true);
});

});
