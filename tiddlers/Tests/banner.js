/*\

Tests the sidebar and its banner.

\*/

describe('Banner', function() {

var wiki, register, init, createElement, window, oldPopup;

beforeEach(async function() {
	wiki = new $tw.Wiki();
	$tw.popup = new $tw.utils.Popup({rootElement: new $tw.test.mock.EventTarget()});
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

beforeAll(function() {
	oldPopup = $tw.popup;
});

afterAll(function() {
	$tw.popup = oldPopup;
});

function triggerChildren(widget, targetClass) {
	function recurse(widget) {
		for (var i = 0; i < widget.children.length; i++) {
			var child = widget.children[i];
			if (child.class && child.class.indexOf(targetClass) >= 0) {
				child.domNode.dispatchEvent({
					type: "click",
					preventDefault: function() {},
					stopPropagation: function() {}
				});
			}
			recurse(child);
		}
	}
	var oldRoot = $tw.rootWidget;
	try {
		// Currently, its necessary to have the messagerelays connected to the
		// $tw.rootWidget, or else it'll assume it's detached and deconstruct.
		$tw.rootWidget = widget;

		recurse(widget);
	} finally {
		$tw.rootWidget = oldRoot;
	}
};

it("changes navigates to modals when in fullscreen mode", async function() {
	wiki.addTiddlers([
		{title: "$:/graph/Default", template: "Template"},
		{title: "Template", text: "<$graph><$node $tiddler=Target actions='<$action-navigate $to=Target/>'/>"}]);
	var text = "<$messagecatcher $tm-modal='<$action-test message=tm-modal/>' $tm-navigate='<$action-test message=tm-navigate/>'>\n\n<$transclude $tiddler='$:/plugins/flibbles/graph/ui/SideBar' />\n";
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

it("does not rebuild selector on graph change", async function() {
	function findSelector(found, node) {
		return found
		|| ((node.tag === "select")?
			node:
			node.children.reduce(findSelector, null));
	};
	// This is important, or else the selector will constantly de-select while
	// users are trying to use it.
	wiki.addTiddlers([
		{title: "$:/graph/A", template: "Name"},
		{title: "$:/graph/B", template: "Name"},
		{title: "State", text: "$:/graph/A"},
		{title: "Name", text: "Graph=<$text text={{!!title}}/>\n"}]);
	var text = "<$transclude $tiddler='$:/plugins/flibbles/graph/ui/SideBar' state=State />\n";
	var widgetNode = $tw.test.renderGlobal(wiki, text);
	expect(widgetNode.parentDomNode.innerHTML).toContain("Graph=$:/graph/A");
	var select = findSelector(null, widgetNode.parentDomNode);
	select.className+= " test-insert";
	// Now let's change the graph and refresh our widget tree
	wiki.addTiddler({title: "State", text: "$:/graph/B"});
	await $tw.test.flushChanges();
	var select = findSelector(null, widgetNode.parentDomNode);
	expect(select.className).toContain("test-insert");
	// Confirming that we actually DID change graphs. It'd be dumb if this test
	// passed only because we weren't actually changing the sidebar graph.
	expect(widgetNode.parentDomNode.innerHTML).toContain("Graph=$:/graph/B");
});

it("relays messages from the sidebar into the graph", function() {
	var method = spyOn($tw.test, "actionMethod");
	wiki.addTiddler({title: "Button", tags: "$:/tags/flibbles/graph/Toolbar", text: "<$button class=graph-test-button actions='<$action-sendmessage $message=graph-test relayed=true/>'/>\n"});
	var text = "<$transclude $tiddler='$:/plugins/flibbles/graph/ui/SideBar' />\n";
	var widgetNode = $tw.test.renderGlobal(wiki, text);
	var oldRoot = $tw.rootWidget;
	try {
		// Currently, its necessary to have the messagerelays connected to the
		// $tw.rootWidget, or else it'll assume it's detached and deconstruct.
		$tw.rootWidget = widgetNode;
		triggerChildren(widgetNode, "graph-test-button");
	} finally {
		$tw.rootWidget = oldRoot;
	}
	expect(method).toHaveBeenCalledWith("graph-test", {relayed: "true"});
});

it("does not introduce unneeded <p> blocks", function() {
	var method = spyOn($tw.test, "actionMethod");
	wiki.addTiddlers([
		// The template is deliberately inline. No newlines. Shouldn't matter.
		{title: "Template", text: "<$graph><$text text='Graph rendered'/>"},
		{title: "$:/graph/Default", template: "Template"}]);
	var text = "<$transclude $tiddler='$:/plugins/flibbles/graph/ui/SideBar' />\n";
	var widgetNode = $tw.test.renderGlobal(wiki, text);
	expect(widgetNode.parentDomNode.innerHTML).not.toContain("<p");
	expect(widgetNode.parentDomNode.innerHTML).toContain("Graph rendered");
});

it("does not show export if no export messages exist", function() {
	var text = "<$vars graphengine=Also>\n\n<$transclude $tiddler='$:/plugins/flibbles/graph/ui/SideBar' />\n";
	var widgetNode = $tw.test.renderGlobal(wiki, text);
	var klass = "graph-export-button";
	expect(widgetNode.parentDomNode.innerHTML).not.toContain(klass);
	triggerChildren(widgetNode, klass);
	// Nothing should happen if we try to trigger it
	var stateTiddlers = wiki.filterTiddlers("[prefix[$:/state/]]");
	expect(stateTiddlers.length).toBe(0);
});

it("can export the graph", async function() {
	wiki.addTiddler({title: "State", text: "$:/graph/Graph to Image"});
	var text = "<$transclude $tiddler='$:/plugins/flibbles/graph/ui/SideBar' state=State />\n";
	var widgetNode = $tw.test.renderGlobal(wiki, text);
	var stateTiddlers = wiki.filterTiddlers("[prefix[$:/state/]]");
	expect(stateTiddlers.length).toBe(0);
	var startingTiddlers = wiki.allTitles();
	triggerChildren(widgetNode, "graph-export-button");
	// Now there should be a state tiddler representing the open popup
	stateTiddlers = wiki.filterTiddlers("[prefix[$:/state/]]");
	expect(stateTiddlers.length).toBe(1);
	await $tw.test.flushChanges();
	// The PNG listing should have a nicer description than just "png"
	var pngDescription = $tw.wiki.getTiddler("$:/language/Docs/Types/image/png").fields.description;
	expect(widgetNode.parentDomNode.innerHTML).toContain(pngDescription);
	// The test engine also includes an unrecognized type that must still be
	// displayed, even if TW has no information on that type.
	expect(widgetNode.parentDomNode.innerHTML).toContain(">unknowntype<")
	// Now lets set up a mock saver
	var oldRoot = $tw.rootWidget,
		oldBrowser = $tw.browser;
	try {
		// Currently, its necessary to have the messagerelays connected to the
		// $tw.rootWidget, or else it'll assume it's detached and deconstruct.
		$tw.rootWidget = widgetNode;
		$tw.browser = true;
		spyOn($tw.SaverHandler.prototype, "initSavers");
		var mockSaver = new $tw.SaverHandler({wiki: wiki});
		mockSaver.savers = [{
			info: {capabilities: ["download"]},
			save: jasmine.createSpy("save", function(text, method, callback, options) {
				expect(options.variables.filename).toBe("Graph to Image");
				expect(options.variables.type).toBe("image/png");
				var expected = $tw.wiki.getTiddlerText("$:/favicon.ico");
				// TODO: This part isn't working yet, which happens to be the most important part

				//expect($tw.utils.base64Encode(text, true, false)).toBe(expected);
			}).and.callThrough()
		}];
		// Now let's activate the PNG option
		triggerChildren(widgetNode, "graph-export-type-png");
		expect(mockSaver.savers[0].save).toHaveBeenCalled();
	} finally {
		$tw.rootWidget = oldRoot;
		$tw.browser = oldBrowser;
	}
	// We should be back to the tiddlers we started with
	expect(wiki.allTitles()).toEqual(startingTiddlers);
});

});
