/*\

Tests the properties.river global widget.

\*/

describe('properties.river \\widget', function() {

var wiki, update, window, init;

var inSidebar = "\\procedure graph-sidebar() yes\n";

beforeEach(async function() {
	wiki = new $tw.Wiki();
	({init, update, window} = $tw.test.setSpies());
	await $tw.test.setGlobals(wiki);
});

it("correctly identifies when inside the sidebar", function() {
	wiki.addTiddler({title: "Graph", text: "<$graph><$properties.river />"});
	var createElement = $tw.fakeDocument.createElement;
	spyOn($tw.fakeDocument, "createElement").and.callFake(function() {
		var element = createElement.apply(this, arguments);
		element.getBoundingClientRect = () => ({top: 17, left: 13});
		return element;
	});
	var win = window();
	win.innerWidth = 53;
	win.innerHeight = 34;
	var widget = $tw.test.renderGlobal(wiki, '<$transclude $tiddler="$:/plugins/flibbles/graph/ui/SideBar" graph=Graph />');
	expect(init).toHaveBeenCalled();
	expect(init.calls.first().args[1].graph.zoom).toBe(undefined);
});

it("can toggle when used in river", async function() {
	var widget = $tw.test.renderGlobal(wiki, "<$graph><$properties.river />");
	expect(init).toHaveBeenCalled();
	expect(init.calls.first().args[1].graph.zoom).toBe(false);
	// Now we focus on it
	$tw.test.dispatchEvent(wiki, { type: "focus", objectType: "graph"});
	await $tw.test.flushChanges();
	expect(update).toHaveBeenCalled();
	expect(update.calls.first().args[0].graph.zoom).toBe(undefined);
	// Make sure we got a state tiddler that's actually a state tiddler
	var states = wiki.filterTiddlers("[prefix[$:/state/]search:title[river]]");
	expect(states.length).toBe(1);
	// Now we blur it
	update.calls.reset();
	$tw.test.dispatchEvent(wiki, { type: "blur", objectType: "graph"});
	await $tw.test.flushChanges();
	expect(update).toHaveBeenCalled();
	expect(update.calls.first().args[0].graph.zoom).toBe(false);
	expect(wiki.tiddlerExists(states[0])).toBe(false);
});

it("renders inner content once both in and out of river", function() {
	var widget = $tw.test.renderGlobal(wiki, "<$properties.river>Turtles");
	expect(widget.parentDomNode.innerHTML).toBe("<p>Turtles</p>");
	$tw.test.renderGlobal(wiki, inSidebar + "<$properties.river>Turtles");
	expect(widget.parentDomNode.innerHTML).toBe("<p>Turtles</p>");
});

/*** Navigation ***/

it("shuts off navigation when blurred in river", async function() {
	var widget = $tw.test.renderGlobal(wiki, "<$graph><$properties.river><$properties $for=graph navigation=yes/>");
	expect(init.calls.first().args[1].graph.navigation).toBe(false);
	$tw.test.dispatchEvent(wiki, { type: "focus", objectType: "graph"});
	await $tw.test.flushChanges();
	expect(update.calls.first().args[0].graph.navigation).toBe(true);
});

it("leaves navigation alone in the sidebar", async function() {
	var widget = $tw.test.renderGlobal(wiki, inSidebar + "<$graph><$properties $for=graph navigation=yes/><$properties.river />");
	expect(init.calls.first().args[1].graph.navigation).toBe(true);
	$tw.test.dispatchEvent(wiki, { type: "focus", objectType: "graph"});
	await $tw.test.flushChanges();
	expect(update).not.toHaveBeenCalled();
});

});
