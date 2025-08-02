/*\

Tests the action-modal widget.

\*/

describe('ActionModalWidget', function() {

var wiki, window, modalBackdrop;

beforeEach(function() {
	modalBackdrop = undefined;
	wiki = new $tw.Wiki();
	({window} = $tw.test.setSpies());
});

function whileSpyingOnModal(method) {
	var oldModal = $tw.modal;
	function closeDown() {
		$tw.rootWidget.dispatchEvent({type: "tm-modal-finish", param:"Exists"});
	}
	try {
		$tw.modal = {display: function() {
			modalBackdrop = new (window().EventTarget)();
			// Let's mimick the backdrop dismantler
			modalBackdrop.addEventListener("click", closeDown, false);
		}};
		spyOn($tw.modal, "display").and.callThrough();
		method();
	} finally {
		$tw.modal = oldModal;
	}
};

it('does nothing if $tiddler is not set', function() {
	var widgetNode = $tw.test.renderText(wiki,"<$action-modal><$action-test/>");
	spyOn($tw.test, "actionMethod");
	whileSpyingOnModal(() => {
		widgetNode.invokeActions(widgetNode, {});
		expect($tw.modal.display).not.toHaveBeenCalled();
		expect($tw.test.actionMethod).not.toHaveBeenCalled();
	});
});

it('invokes children only after modal', function() {
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

it('passes along attributes as variables', function() {
	var widgetNode = $tw.test.renderText(wiki, "<$action-modal value=success $tiddler=anything><$action-test/>");
	spyOn($tw.test, "actionMethod");
	whileSpyingOnModal(() => {
		var event = {};
		widgetNode.invokeActions(widgetNode, event);
		expect($tw.modal.display).toHaveBeenCalledTimes(1);
		expect($tw.modal.display).toHaveBeenCalledWith( "anything", { variables: {value: "success"}, event: {}});
	});
});

// Issue #43: Modals instantly close when opened on mobile
it("it delays backdrop click for a while to prevent auto-closing", async function() {
	var widgetNode = $tw.test.renderText(wiki, `<$action-modal $tiddler=anything><$action-test/>`);
	var modal;
	spyOn($tw.test, "actionMethod");
	whileSpyingOnModal(() => {
		widgetNode.invokeActions(widgetNode, {});
		expect($tw.modal.display).toHaveBeenCalled();
		modalBackdrop.dispatchEvent({type: "click"});
		expect($tw.test.actionMethod).not.toHaveBeenCalled();
		modal = $tw.modal;
	});
	await $tw.test.flushChanges(10);
	modalBackdrop.dispatchEvent({type: "click"});
	expect($tw.test.actionMethod).toHaveBeenCalled();
});

});
