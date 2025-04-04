/*\

Tests the action.addedge widget.

\*/

describe('ActionModalWidget', function() {

var wiki, window, modal, oldModal;

beforeEach(async function() {
	wiki = new $tw.Wiki();
	({window} = $tw.test.setSpies());
	await $tw.test.setGlobals(wiki);
	oldModal = $tw.modal;
	$tw.modal = modal = new $tw.utils.Modal(wiki);
	spyOn($tw.modal, "display");
});

afterEach(function() {
	$tw.modal = oldModal;
});

it("can add an edge from a graph event", function() {
	wiki.addTiddlers([
		{title: "A"},
		{title: "$:/config/flibbles/relink/fields/myfield", text: "title"}]);
	var widgetNode = $tw.test.renderGlobal(wiki,"<$graph addEdge='<$action.addedge/>'><$node $tiddler=A/><$node $tiddler='to there'/>");
	$tw.test.dispatchEvent(wiki, {objectType: "graph", type: "addEdge"}, {fromTiddler: "A", toTiddler: "to there"});
	expect($tw.modal.display).toHaveBeenCalled();
	$tw.rootWidget.dispatchEvent({type: "tm-modal-finish", param: "myfield"});
	expect(wiki.getTiddler("A").fields.myfield).toBe("to there");
});

it("lists fields in the modal", function() {
	wiki.addTiddlers([
		{title: "A"},
		{title: "Else", existingField: "this is used too"},
		$tw.wiki.getTiddler("$:/core/macros/keyboard-driven-input"),
		{title: "$:/config/flibbles/graph/edges/configuredField", text: "{}", type: "application/json"}]);
	var widgetNode = $tw.test.renderAction(wiki,"\\define fromTiddler() A\n\\define toTiddler() B\n<$action.addedge />");
	$tw.modal.display.and.callThrough();
	// If we're actually going to call modal.display, we've got to mockup a
	// window and document for it to attach itself to.
	var doc = window().document;
	widgetNode.invokeActions(widgetNode, {event:{target:{ownerDocument:doc}}});
	expect($tw.modal.display).toHaveBeenCalled();
	var innerHTML = doc.body.innerHTML;
	expect(innerHTML).toContain("configuredField");
	expect(innerHTML).not.toContain("tc-tiddlylink-missing");
	// No support yet for existingField. Not sure I want it.
	//expect(innerHTML).toContain("existingField");
});

it("can use custom values", function() {
	wiki.addTiddlers([
		{title: "A"},
		{title: "$:/config/flibbles/relink/fields/myfield", text: "title"}]);
	var widgetNode = $tw.test.renderAction(wiki,"<$action.addedge $fromTiddler=A $toTiddler='to there'/>");
	widgetNode.invokeActions(widgetNode, {});
	$tw.rootWidget.dispatchEvent({type: "tm-modal-finish", param: "myfield"});
	expect(wiki.getTiddler("A").fields.myfield).toBe("to there");
});

});
