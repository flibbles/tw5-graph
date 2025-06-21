/*\

Tests the properties.popup widget macro.

\*/

describe('PropertiesPopup \\widget', function() {

var wiki, oldPopup;

beforeEach(async function() {
	wiki = new $tw.Wiki();
	$tw.test.setSpies();
	var oldCreate = $tw.fakeDocument.createElement;
	spyOn($tw.fakeDocument, "createElement").and.callFake(function(tag) {
		var element = oldCreate(tag);
		$tw.utils.extend(element, $tw.test.mock.EventHandler.prototype);
		return element;
	});
	await $tw.test.setGlobals(wiki);
});

beforeAll(function() {
	oldPopup = $tw.popup;
	$tw.popup = new $tw.utils.Popup({rootElement: new $tw.test.mock.EventHandler()});
});

afterAll(function() {
	$tw.popup = oldPopup;
});

// TODO: Seems to goof up when switching from one node to another quickly

it("works with default popup slot", async function() {
	var expected = '<div class="graph-drop-down"><p>Text content</p></div>';
	wiki.addTiddler({title: "Target", text: "Text content"});
	var text =  "<$graph>\n\n<$properties.popup $ms=0 $state=State>\n\n<$node $tiddler=Target/>\n";
	var widget = $tw.test.renderGlobal(wiki, text);
	// This should be the graph element. We send a mousemove to the graph-canvas
	var element = widget.parentDomNode.children[0];
	element.dispatchEvent({type: "mousemove", offsetX: 13, offsetY: 17});
	// Now we send a hover event through the engine...
	$tw.test.dispatchEvent(wiki, {type: "hover", objectType: "nodes", id: "Target"}, {x: 125, y: 150, xView: 19, yView: 21});
	// Doesn't really matter what it is, only that it's been set
	expect(wiki.getTiddlerText("State-delay").length).toBeGreaterThan(0);
	await $tw.test.flushChanges();
	expect(wiki.tiddlerExists("State-delay")).toBe(false);
	// It's 10 greater than what we put it, because we displace it somewhat
	expect(wiki.getTiddlerText("State")).toEqual("(23,27,0,0)");
	await $tw.test.flushChanges();
	expect(widget.parentDomNode.innerHTML).toContain(expected);
	$tw.test.dispatchEvent(wiki, {type: "blur", objectType: "nodes", id: "Target"});
	await $tw.test.flushChanges();
	// We flush again because the blur delay needs to flush through
	await $tw.test.flushChanges();
	expect(wiki.tiddlerExists("State")).toBe(false);
	expect(wiki.tiddlerExists("State-delay")).toBe(false);
	expect(widget.parentDomNode.innerHTML).not.toContain(expected);
});

it("works with custom popup slot", async function() {
	var expected = '<div class="graph-drop-down"><p>Text content</p></div>';
	wiki.addTiddler({title: "Target", caption: "Text content"});
	var text =  "<$graph><$properties.popup $ms=0>\n\n<$node $tiddler=Target/>\n\n<$fill $name=tooltip>\n\n<$tiddler tiddler=<<currentTooltip>> >\n\n{{!!caption}}";
	var widget = $tw.test.renderGlobal(wiki, text);
	$tw.test.dispatchEvent(wiki, {type: "hover", objectType: "nodes", id: "Target"}, {x: 125, y: 150, xView: 13, yView: 17});
	// Flush once to make the action-delay trigger
	await $tw.test.flushChanges();
	// Flush again to propogate the changed state tiddlers
	await $tw.test.flushChanges();
	expect(widget.parentDomNode.innerHTML).toContain(expected);
	$tw.test.dispatchEvent(wiki, {type: "blur", objectType: "nodes", id: "Target"});
	await $tw.test.flushChanges();
	// We flush again because the blur delay needs to flush through
	await $tw.test.flushChanges();
	expect(widget.parentDomNode.innerHTML).not.toContain(expected);
});

it("can be interrupted", async function() {
	var expected = "Text content";
	wiki.addTiddler({title: "Target", text: expected});
	var text =  "<$graph>\n\n<$properties.popup $ms=0 $state=State>\n\n<$node $tiddler=Target/>\n";
	var widget = $tw.test.renderGlobal(wiki, text);
	$tw.test.dispatchEvent(wiki, {type: "hover", objectType: "nodes", id: "Target"}, {x: 125, y: 150, xView: 13, yView: 17});
	await $tw.test.flushChanges();
	// We flush again because the blur delay needs to flush through
	await $tw.test.flushChanges();
	expect(widget.parentDomNode.innerHTML).toContain(expected);
	$tw.test.dispatchEvent(wiki, {type: "blur", objectType: "nodes", id: "Target"});
	// Flush once to make the action-delay trigger
	await $tw.test.flushChanges();
	// We flush again because the blur delay needs to flush through
	await $tw.test.flushChanges();
	expect(wiki.tiddlerExists("State")).toBe(false);
	expect(wiki.tiddlerExists("State-delay")).toBe(false);
	expect(widget.parentDomNode.innerHTML).not.toContain(expected);
});

it("dragging removes popup and prevents return", async function() {
	var expected = "Text content";
	wiki.addTiddler({title: "Target", text: expected});
	var text =  "<$graph>\n\n<$properties.popup $ms=0 $state=State>\n\n<$node $tiddler=Target/>\n";
	var widget = $tw.test.renderGlobal(wiki, text);
	$tw.test.dispatchEvent(wiki, {type: "hover", objectType: "nodes", id: "Target"}, {x: 125, y: 150, xView: 13, yView: 17});
	// Flush once to make the action-delay trigger
	await $tw.test.flushChanges();
	// We flush again because the blur delay needs to flush through
	await $tw.test.flushChanges();
	// Popup should now exist
	expect(widget.parentDomNode.innerHTML).toContain(expected);
	$tw.test.dispatchEvent(wiki, {type: "drag", objectType: "nodes", id: "Target"}, {x: 126, y: 151});
	expect(wiki.tiddlerExists("State")).toBe(false);
	expect(wiki.tiddlerExists("State-delay")).toBe(false);
	await $tw.test.flushChanges();
	expect(widget.parentDomNode.innerHTML).not.toContain(expected);
});

});
