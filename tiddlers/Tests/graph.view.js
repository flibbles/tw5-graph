/*\

Tests the graph.view global widget.

\*/

describe('graph.view \\widget', function() {

var wiki, init, update;

beforeEach(async function() {
	wiki = new $tw.Wiki();
	({init, update} = $tw.test.setSpies());
	await $tw.test.setGlobals(wiki);
});

it("uses a standard graph if no template specified", function() {
	wiki.addTiddler({title: "Target", filter: "A"});
	var text = "<$graph.view $tiddler=Target />\n";
	var widget = $tw.test.renderGlobal(wiki, text);
	var objects = init.calls.first().args[1];
	expect(Object.keys(objects.nodes)).toEqual(["A"]);
	expect(widget.parentDomNode.textContent).toBe("");
});

it("uses template specified by the $tiddler", function() {
	wiki.addTiddlers([
		{title: "Target", text: "Target content", template: "Template"},
		{title: "Template", text: "Temp: {{}}"}]);
	var text = "<$graph.view $tiddler=Target />\n";
	var widget = $tw.test.renderGlobal(wiki, text);
	expect(widget.parentDomNode.innerHTML).toBe("<p>Temp: Target content</p>");
});

it("can specify custom $template", function() {
	wiki.addTiddlers([
		{title: "Target", text: "Target content", template: "Template"},
		{title: "Template", text: "Temp: {{}}"},
		{title: "Alternate", text: "Alter: {{}}"}]);
	var text = "<$graph.view $tiddler=Target $template=Alternate/>\n";
	var widget = $tw.test.renderGlobal(wiki, text);
	expect(widget.parentDomNode.innerHTML).toBe("<p>Alter: Target content</p>");
});

it("defaults to Default View if no $tiddler given", function() {
	wiki.addTiddlers([
		{title: "$:/graph/Default", text: "Default content", template: "Template"},
		{title: "Template", text: "Temp: {{}}"}]);
	var text = "<$graph.view />\n";
	var widget = $tw.test.renderGlobal(wiki, text);
	expect(widget.parentDomNode.innerHTML).toBe("<p>Temp: Default content</p>");
});

});
