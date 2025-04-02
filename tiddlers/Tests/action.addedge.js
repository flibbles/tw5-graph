/*\

Tests the action.addedge widget.

\*/

describe('ActionModalWidget', function() {

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

// TODO: Test this more thoroughly. Modal shows fields listed
	// Arguments can be manually entered, etc...

});
