/*\

Tests the graph.popup widget macro.

\*/

describe('GraphPopup \\widget', function() {

var wiki, oldPopup;

beforeEach(async function() {
	wiki = new $tw.Wiki();
	var pluginInfo = $tw.wiki.getPluginInfo("$:/plugins/flibbles/graph");
	wiki.addTiddlers(Object.values(pluginInfo.tiddlers));
	wiki.addTiddler($tw.wiki.getTiddler("$:/core/config/GlobalImportFilter"));
	$tw.test.setSpies();
	// TODO: I'd love to not have to do this, but I need a getGraphObjects
	// that works and doesn't go out of date when I make core plugin changes.
	await $tw.test.flushChanges();
});

beforeAll(function() {
	oldPopup = $tw.popup;
	$tw.popup = new $tw.utils.Popup({rootElement: new $tw.test.mock.EventHandler()});
});

afterAll(function() {
	$tw.popup = oldPopup;
});

it("works with default popup slot", async function() {
	var expected = '<div class="graph-drop-down"><p>Text content</p></div>';
	wiki.addTiddler({title: "Target", text: "Text content"});
	var text =  "<$graph>\n\n<$graph.popup $ms=0 $state=State>\n\n<$node $tiddler=Target/>\n";
	var widget = $tw.test.renderGlobal(wiki, text);
	$tw.test.dispatchEvent(wiki, {type: "hover", objectType: "nodes", id: "Target"}, {x: 125, y: 150, xView: 13, yView: 17});
	// Doesn't really matter what it is, only that it's been set
	expect(wiki.getTiddlerText("State-delay").length).toBeGreaterThan(0);
	await $tw.test.flushChanges();
	expect(wiki.tiddlerExists("State-delay")).toBe(false);
	expect(wiki.getTiddlerText("State")).toEqual("(13,17,100,0)");
	await $tw.test.flushChanges();
	expect(widget.parentDomNode.innerHTML).toContain(expected);
	$tw.test.dispatchEvent(wiki, {type: "blur", objectType: "nodes", id: "Target"});
	await $tw.test.flushChanges();
	expect(wiki.tiddlerExists("State")).toBe(false);
	expect(wiki.tiddlerExists("State-delay")).toBe(false);
	expect(widget.parentDomNode.innerHTML).not.toContain(expected);
});

it("works with custom popup slot", async function() {
	var expected = '<div class="graph-drop-down"><p>Text content</p></div>';
	wiki.addTiddler({title: "Target", caption: "Text content"});
	var text =  "<$graph><$graph.popup $ms=0>\n\n<$node $tiddler=Target/>\n\n<$fill $name=tooltip>\n\n<$tiddler tiddler=<<currentTooltip>> >\n\n{{!!caption}}";
	var widget = $tw.test.renderGlobal(wiki, text);
	$tw.test.dispatchEvent(wiki, {type: "hover", objectType: "nodes", id: "Target"}, {x: 125, y: 150, xView: 13, yView: 17});
	// Flush once to make the action-delay trigger
	await $tw.test.flushChanges();
	// Flush again to propogate the changed state tiddlers
	await $tw.test.flushChanges();
	expect(widget.parentDomNode.innerHTML).toContain(expected);
	$tw.test.dispatchEvent(wiki, {type: "blur", objectType: "nodes", id: "Target"});
	await $tw.test.flushChanges();
	expect(widget.parentDomNode.innerHTML).not.toContain(expected);
});

it("can be interrupted", async function() {
	var text = "Text content";
	wiki.addTiddler({title: "Target", text: text});
	var text =  "<$graph>\n\n<$graph.popup $ms=0 $state=State>\n\n<$node $tiddler=Target/>\n";
	var widget = $tw.test.renderGlobal(wiki, text);
	$tw.test.dispatchEvent(wiki, {type: "hover", objectType: "nodes", id: "Target"}, {x: 125, y: 150, xView: 13, yView: 17});
	$tw.test.dispatchEvent(wiki, {type: "blur", objectType: "nodes", id: "Target"});
	expect(wiki.tiddlerExists("State-delay")).toBe(false);
	// Flush once to make the action-delay trigger
	await $tw.test.flushChanges();
	// Flush again to propogate the changed state tiddlers
	await $tw.test.flushChanges();
	expect(wiki.tiddlerExists("State")).toBe(false);
	expect(wiki.tiddlerExists("State-delay")).toBe(false);
	expect(widget.parentDomNode.innerHTML).not.toContain(text);
});

});
