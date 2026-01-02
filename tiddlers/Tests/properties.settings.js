/*\

Tests the properties.settings global widget.

\*/

describe('properties.settings \\widget', function() {

var wiki, init, update, oldPopup;
var stackPrefix = "$:/config/flibbles/graph/nodes/stack/";

beforeEach(async function() {
	wiki = new $tw.Wiki();
	$tw.popup = new $tw.utils.Popup({rootElement: new $tw.test.mock.EventTarget()});
	({init, update} = $tw.test.setSpies());
	await $tw.test.setGlobals(wiki);
});

beforeAll(function() {
	oldPopup = $tw.Popup;
});

afterAll(function() {
	$tw.Popup = oldPopup;
});

function nodeConfig(name, filter, properties) {
	return {
		title: stackPrefix + name,
		text: JSON.stringify(properties),
		filter: filter,
		type: "application/json"};
};

it("can take properties from the view", function() {
	wiki.addTiddler({title: "View",
		"graph.nodes": '{"value": "nProp"}',
		"graph.edges": '{"value": "eProp"}',
		"graph.graph": '{"value": "gProp"}'});
	var text = "<$let currentTiddler=View><$graph><$properties.settings><$node $tiddler=X/><$node $tiddler=Y/><$edge $from=X $to=Y/>";
	var widget = $tw.test.renderGlobal(wiki, text);
	var objects = init.calls.first().args[1];
	expect(objects.nodes).toEqual({X: {value: "nProp"}, Y: {value: "nProp"}});
	expect(objects.graph.value).toBe("gProp");
	expect(Object.values(objects.edges)).toEqual([{from: "X", to: "Y", value: "eProp"}]);
});

it("passes edge settings to internal $edges.typed", function() {
	wiki.addTiddlers([
		{title: "root", tags: "A", list: "B", text: "[[C]] {{D}}"},
		{title: "View", "edges.fields": "tags", "edges.functions": "links"}]);
	var text = "<$let currentTiddler=View><$graph><$properties.settings><$edges.typed $tiddler=root><<toTiddler>>-";
	var widget = $tw.test.renderGlobal(wiki, text);
	expect(widget.parentDomNode.textContent).toBe("A-C-");
});

it("can default templates for popup", async function() {
	wiki.addTiddlers([
		{title: "Target", field: "Field Popup", text: "! Text Header"},
		{title: "View", popup: "yes", "popup.ms": "0"}]);
	var text = "<$let currentTiddler=View>\n\n<$graph>\n\n<$properties.settings>\n\n<$node $tiddler=Target />\n";
	var widget = $tw.test.renderGlobal(wiki, text);
	$tw.test.dispatchEvent(wiki, {type: "hover", objectType: "nodes", id: "Target"});
	await $tw.test.flushChanges();
	await $tw.test.flushChanges();
	var html = widget.parentDomNode.innerHTML;
	expect(html).toContain(">Text Header</h1>");
	// Should be able to render those tooltips as blocks,
	// but not have unnecessary paragraph breaks.
	expect(html).not.toContain("</p>");
});

it("can manage blank templates for popup", async function() {
	wiki.addTiddlers([
		{title: "Target", field: "Field Popup", text: "! Text Header"},
		{title: "View", popup: "yes", "popup.template": "", "popup.ms": "0"}]);
	var text = "<$let currentTiddler=View>\n\n<$graph>\n\n<$properties.settings>\n\n<$node $tiddler=Target />\n";
	var widget = $tw.test.renderGlobal(wiki, text);
	$tw.test.dispatchEvent(wiki, {type: "hover", objectType: "nodes", id: "Target"});
	await $tw.test.flushChanges();
	await $tw.test.flushChanges();
	var html = widget.parentDomNode.innerHTML;
	expect(html).toContain(">Text Header</h1>");
	// Should be able to render those tooltips as blocks,
	// but not have unnecessary paragraph breaks.
	expect(html).not.toContain("</p>");
});


it("can customize templates for popup", async function() {
	wiki.addTiddlers([
		{title: "Target", field: "Field Popup", text: "Text Popup"},
		{title: "View", popup: "yes", "popup.template": "{{!!field}}", "popup.ms": "0"}]);
	var text = "<$let currentTiddler=View><$graph><$properties.settings><$node $tiddler=Target />";
	var widget = $tw.test.renderGlobal(wiki, text);
	$tw.test.dispatchEvent(wiki, {type: "hover", objectType: "nodes", id: "Target"});
	await $tw.test.flushChanges();
	await $tw.test.flushChanges();
	// That </p> makes sure the text is being treated as a block
	expect(widget.parentDomNode.innerHTML).toContain("Field Popup</p>");
});

});
