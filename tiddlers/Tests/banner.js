/*\

Tests the sidebar and its banner.

\*/

describe('Banner', function() {

var wiki, register, init, createElement, window;

beforeEach(async function() {
	wiki = new $tw.Wiki();
	({register, init, window} = $tw.test.setSpies());
	await $tw.test.setGlobals(wiki);
	var createElement = $tw.fakeDocument.createElement;
	spyOn($tw.fakeDocument, "createElement").and.callFake(function() {
		var element = createElement.apply(this, arguments);
		// Defaults so that boundingbox can run without special handling
		element.getBoundingClientRect = () => ({top: 30, left: 30});
		$tw.utils.extend(element, $tw.test.mock.EventTarget.prototype);
		return element;
	})
});

function triggerChildren(widget, targetClass) {
	for (var i = 0; i < widget.children.length; i++) {
		var child = widget.children[i];
		if (child.class === targetClass) {
			child.domNode.dispatchEvent({type: "click"});
		}
		triggerChildren(child, targetClass);
	}
};

it("changes navigates to modals when in fullscreen mode", async function() {
	wiki.addTiddlers([
		{title: "Main", template: "Template"},
		{title: "Template", text: "<$graph><$node $tiddler=Target actions='<$action-navigate $to=Target/>'/>"}]);
	var text = "<$messagecatcher $tm-modal='<$action-test message=tm-modal/>' $tm-navigate='<$action-test message=tm-navigate/>'>\n\n<$transclude $tiddler='$:/plugins/flibbles/graph/ui/SideBar' graph=Main />\n";
	var widgetNode = $tw.test.renderGlobal(wiki, text);
	$tw.test.dispatchEvent(wiki, {type: "actions", objectType: "nodes", id: "Target"});
	expect($tw.test.actionMethod).toHaveBeenCalledTimes(1);
	expect($tw.test.actionMethod).toHaveBeenCalledWith({message: "tm-navigate"});
	$tw.test.actionMethod.calls.reset();
	wiki.addTiddler({title: "$:/state/flibbles/graph/fullscreen", text: "graph-fullscreen"});
	$tw.test.dispatchEvent(wiki, {type: "actions", objectType: "nodes", id: "Target"});
	expect($tw.test.actionMethod).toHaveBeenCalledTimes(1);
	expect($tw.test.actionMethod).toHaveBeenCalledWith({message: "tm-modal"});
});

it("relays messages from the sidebar into the graph", function() {
	var method = spyOn($tw.test, "actionMethod");
	wiki.addTiddlers([
		{title: "Main"},
		{title: "Button", tags: "$:/tags/flibbles/graph/Toolbar", text: "<$button class=graph-test-button actions='<$action-sendmessage $message=graph-test relayed=true/>'/>\n"}]);
	var text = "<$transclude $tiddler='$:/plugins/flibbles/graph/ui/SideBar' graph=Main />\n";
	var widgetNode = $tw.test.renderGlobal(wiki, text);
	var oldRoot = $tw.rootWidget;
	try {
		$tw.rootWidget = widgetNode;
		triggerChildren(widgetNode, "graph-test-button");
	} finally {
		$tw.rootWidget = oldRoot;
	}
	expect(method).toHaveBeenCalledWith("graph-test", {relayed: "true"});
});

});
