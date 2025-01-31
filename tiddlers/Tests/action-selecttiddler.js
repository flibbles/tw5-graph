/*\

Tests that graphs properly refresh.

\*/

describe('action-selecttiddler', function() {

it('invokes children only after modal', function() {
	var wiki = new $tw.Wiki();
	wiki.addTiddlers([
		{title: "Exists"},
		{title: "Results", list: "0"}]);
	var widgetNode = $tw.test.renderText(wiki, "<$action-selecttiddler ><$action-listops $tiddler=Results $subfilter='+[add[1]]' />");
	whileSpyingOnModal(() => {
		widgetNode.invokeActions(widgetNode, {});
		expect($tw.modal.display).toHaveBeenCalled();
		var results = wiki.getTiddler("Results");
		expect(wiki.getTiddler("Results").fields.list).toEqual(["0"]);
		$tw.rootWidget.dispatchEvent({type: "tm-select-finish", param: "Exists"});
		expect(wiki.getTiddler("Results").fields.list).toEqual(["1"]);
	});
});

it('refreshes children before invoking them', function() {
	var wiki = new $tw.Wiki();
	wiki.addTiddlers([
		{title: "Exists"}]);
	var widgetNode = $tw.test.renderText(wiki, "<$action-selecttiddler ><% if [<selectTiddler>is[tiddler]] %><$action-setfield $tiddler=results exists=exists /><% else %><$action-setfield $tiddler=results noexist=noexist>");
	whileSpyingOnModal(() => {
		widgetNode.invokeActions(widgetNode, {});
		expect($tw.modal.display).toHaveBeenCalled();
	});
	$tw.rootWidget.dispatchEvent({type: "tm-select-finish", param: "Exists"});
	var results = wiki.getTiddler("results");
	expect(results).not.toBeUndefined();
	expect(results.fields.exists).toBe("exists");
	expect(results.fields.noexist).toBeUndefined();
});

function whileSpyingOnModal(method) {
	var oldModal = $tw.modal;
	try {
		$tw.modal = {display: function() {}};
		spyOn($tw.modal, "display");
		method();
	} finally {
		$tw.modal = oldModal;
	}
};

});

