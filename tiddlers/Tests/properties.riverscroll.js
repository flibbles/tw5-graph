/*\

Tests the properties.riverscroll global widget.

\*/

describe('properties.riverscroll \\widget', function() {

var wiki, update, window, init;

beforeEach(async function() {
	wiki = new $tw.Wiki();
	({init, update, window} = $tw.test.setSpies());
	var pluginInfo = $tw.wiki.getPluginInfo("$:/plugins/flibbles/graph");
	wiki.addTiddlers(Object.values(pluginInfo.tiddlers));
	wiki.addTiddler($tw.wiki.getTiddler("$:/core/config/GlobalImportFilter"));
	// TODO: I'd love to not have to do this, but I need a getGraphObjects
	// that works and doesn't go out of date when I make core plugin changes.
	await $tw.test.flushChanges();
});

it("zoom always enabled in sidebar", function() {
	wiki.addTiddler({title: "Graph", text: "<$graph><$properties.riverscroll />"});
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
	expect(init.calls.first().args[1].graph.zoom).toBe(true);
});

it("can toggle when used in river", async function() {
	var widget = $tw.test.renderGlobal(wiki, "<$graph><$properties.riverscroll />");
	expect(init).toHaveBeenCalled();
	expect(init.calls.first().args[1].graph.zoom).toBe(false);
	// Now we focus on it
	$tw.test.dispatchEvent(wiki, { type: "focus", objectType: "graph"});
	await $tw.test.flushChanges();
	expect(update).toHaveBeenCalled();
	expect(update.calls.first().args[0].graph.zoom).toBe(true);
	// Make sure we got a state tiddler that's actually a state tiddler
	var states = wiki.filterTiddlers("[prefix[$:/state/]search:title[riverscroll]]");
	expect(states.length).toBe(1);
	// Now we blur it
	update.calls.reset();
	$tw.test.dispatchEvent(wiki, { type: "blur", objectType: "graph"});
	await $tw.test.flushChanges();
	expect(update).toHaveBeenCalled();
	expect(update.calls.first().args[0].graph.zoom).toBe(false);
	expect(wiki.tiddlerExists(states[0])).toBe(false);
});

});
