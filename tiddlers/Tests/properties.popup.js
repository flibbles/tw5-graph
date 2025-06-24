/*\

Tests the properties.popup widget macro.

\*/

describe('PropertiesPopup \\widget', function() {

var wiki, oldPopup;

beforeEach(async function() {
	wiki = new $tw.Wiki();
	$tw.popup = new $tw.utils.Popup({rootElement: new $tw.test.mock.EventHandler()});
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
});

afterAll(function() {
	$tw.popup = oldPopup;
});

it("works with default popup slot", async function() {
	var expected = '><p>Text content</p></div>';
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
	// This will always be (0,0,0,0) because we don't actually use it
	expect(wiki.getTiddlerText("State")).toEqual("(0,0,0,0)");
	await $tw.test.flushChanges();
	var html = widget.parentDomNode.innerHTML;
	expect(html).toContain(expected);
	$tw.test.dispatchEvent(wiki, {type: "blur", objectType: "nodes", id: "Target"});
	await $tw.test.flushChanges();
	expect(wiki.tiddlerExists("State")).toBe(false);
	expect(wiki.tiddlerExists("State-delay")).toBe(false);
	expect(widget.parentDomNode.innerHTML).not.toContain(expected);
});

it("works with custom popup slot", async function() {
	var expected = '><p>Text content</p></div>';
	wiki.addTiddler({title: "Target", caption: "Text content"});
	var text =  "<$graph><$properties.popup $ms=0>\n\n<$node $tiddler=Target/>\n\n<$fill $name=tooltip>\n\n<$tiddler tiddler=<<currentTooltip>> >\n\n{{!!caption}}";
	var widget = $tw.test.renderGlobal(wiki, text);
	$tw.test.dispatchEvent(wiki, {type: "hover", objectType: "nodes", id: "Target"}, {x: 125, y: 150, xView: 13, yView: 17});
	// Flush once to make the action-delay trigger
	await $tw.test.flushChanges();
	expect(widget.parentDomNode.innerHTML).toContain(expected);
	$tw.test.dispatchEvent(wiki, {type: "blur", objectType: "nodes", id: "Target"});
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
	expect(widget.parentDomNode.innerHTML).toContain(expected);
	$tw.test.dispatchEvent(wiki, {type: "blur", objectType: "nodes", id: "Target"});
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
	// Popup should now exist
	expect(widget.parentDomNode.innerHTML).toContain(expected);
	$tw.test.dispatchEvent(wiki, {type: "drag", objectType: "nodes", id: "Target"}, {x: 126, y: 151});
	expect(wiki.tiddlerExists("State")).toBe(false);
	expect(wiki.tiddlerExists("State-delay")).toBe(false);
	await $tw.test.flushChanges();
	expect(widget.parentDomNode.innerHTML).not.toContain(expected);
});

it("gets decent width and height defaults", async function() {
	wiki.addTiddler({title: "Target", text: "Decent text content"});
	var text =  "<$graph>\n\n<$properties.popup $ms=0>\n\n<$node $tiddler=Target/>\n";
	var widget = $tw.test.renderGlobal(wiki, text);
	// This should be the graph element. We send a mousemove to the graph-canvas
	var element = widget.parentDomNode.children[0];
	await $tw.test.flushChanges();
	element.dispatchEvent({type: "mousemove", offsetX: 13, offsetY: 17});
	// Now we send a hover event through the engine...
	$tw.test.dispatchEvent(wiki, {type: "hover", objectType: "nodes", id: "Target"}, {x: 125, y: 150, xView: 19, yView: 21});
	await $tw.test.flushChanges();
	var html = widget.parentDomNode.innerHTML;
	expect(html).toContain("Decent text content");
	// Not to contain any width, because default browser behavior or css is fine
	expect(html).not.toContain("width");
	expect(html).toContain("max-height:50%;");
});

it("can customize width and height", async function() {
	wiki.addTiddler({title: "Target", text: "Text content"});
	var text =  "<$graph>\n\n<$properties.popup $width=423px $height=17em $ms=0>\n\n<$node $tiddler=Target/>\n";
	var widget = $tw.test.renderGlobal(wiki, text);
	// This should be the graph element. We send a mousemove to the graph-canvas
	var element = widget.parentDomNode.children[0];
	element.dispatchEvent({type: "mousemove", offsetX: 13, offsetY: 17});
	// Now we send a hover event through the engine...
	$tw.test.dispatchEvent(wiki, {type: "hover", objectType: "nodes", id: "Target"}, {x: 125, y: 150, xView: 19, yView: 21});
	await $tw.test.flushChanges();
	var html = widget.parentDomNode.innerHTML;
	expect(html).toContain("Text content");
	expect(html).toContain("max-width:423px;");
	expect(html).toContain("max-height:17em;");
});

async function testQuadrant(X, Y) {
	var text =  "<$graph>\n\n<$properties.popup $ms=0 $state=State>\n\n<$node $tiddler=Target/>\n";
	var widget = $tw.test.renderGlobal(wiki, text);
	// This should be the graph element. We send a mousemove to the graph-canvas
	var element = widget.parentDomNode.children[0];
	element.offsetWidth = 100;
	element.offsetHeight = 100;
	element.dispatchEvent({type: "mousemove", offsetX: X, offsetY: Y});
	// Now we send a hover event through the engine...
	$tw.test.dispatchEvent(wiki, {type: "hover", objectType: "nodes", id: "Target"}, {x: 125, y: 150, xView: 19, yView: 21});
	// Doesn't really matter what it is, only that it's been set
	await $tw.test.flushChanges();
	await $tw.test.flushChanges();
	return widget.parentDomNode.innerHTML;
};

it("places popup correctly for top left quadrant", async function() {
	var html = await testQuadrant(12, 16);
	expect(html).toContain("left:12px;");
	expect(html).toContain("top:16px;");
});

it("places popup correctly for bottom left quadrant", async function() {
	var html = await testQuadrant(12, 86);
	expect(html).toContain("left:12px;");
	expect(html).toContain("bottom:14px;");
});

it("places popup correctly for top left quadrant", async function() {
	var html = await testQuadrant(82, 16);
	expect(html).toContain("right:18px;");
	expect(html).toContain("top:16px;");
});

it("places popup correctly for bottom left quadrant", async function() {
	var html = await testQuadrant(82, 86);
	expect(html).toContain("right:18px;");
	expect(html).toContain("bottom:14px;");
});

});
