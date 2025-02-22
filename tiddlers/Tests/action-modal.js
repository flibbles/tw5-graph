/*\

Tests that graphs properly refresh.

\*/

describe('ActionModalWidget', function() {

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

it('does nothing if $tiddler is not set', function() {
	var wiki = new $tw.Wiki();
	var widgetNode = $tw.test.renderText(wiki,"<$action-modal><$action-test/>");
	spyOn($tw.test, "actionMethod");
	whileSpyingOnModal(() => {
		widgetNode.invokeActions(widgetNode, {});
		expect($tw.modal.display).not.toHaveBeenCalled();
		expect($tw.test.actionMethod).not.toHaveBeenCalled();
	});
});

it('invokes children only after modal', function() {
	var wiki = new $tw.Wiki();
	var widgetNode = $tw.test.renderText(wiki, "<$action-modal $tiddler=anything><$action-test/>");
	spyOn($tw.test, "actionMethod");
	whileSpyingOnModal(() => {
		widgetNode.invokeActions(widgetNode, {});
		expect($tw.modal.display).toHaveBeenCalled();
		expect($tw.test.actionMethod).not.toHaveBeenCalled();
		$tw.rootWidget.dispatchEvent({type: "tm-modal-finish", param:"Exists"});
		expect($tw.test.actionMethod).toHaveBeenCalledTimes(1);
	});
});

it('refreshes children before invoking them', function() {
	var wiki = new $tw.Wiki();
	var widgetNode = $tw.test.renderText(wiki, "<$action-modal $tiddler=anything><% if [<selection>match[Exists]] %><$action-test exists=yes /><% else %><$action-test exists=no>");
	spyOn($tw.test, "actionMethod");
	whileSpyingOnModal(() => {
		widgetNode.invokeActions(widgetNode, {});
		expect($tw.modal.display).toHaveBeenCalled();
	});
	$tw.rootWidget.dispatchEvent({type: "tm-modal-finish", param: "Exists"});
	expect($tw.test.actionMethod).toHaveBeenCalledTimes(1);
	expect($tw.test.actionMethod).toHaveBeenCalledWith({exists: "yes"});
});

});
