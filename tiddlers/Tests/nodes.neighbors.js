/*\

Tests the nodes.neighbors global widget.

\*/

fdescribe('nodes.neighbors \\widget', function() {

var wiki, init;

beforeEach(async function() {
	wiki = new $tw.Wiki();
	({init} = $tw.test.setSpies());
	await $tw.test.setGlobals(wiki);
});

it("generates nodes without any block", function() {
	wiki.addTiddlers([
		{title: "home", tags: "to"},
		{title: "from", tags: "home"},
		{title: "unrelated"}]);
	var text = "<$graph><$nodes.neighbors $filter='home'/>";
	var widget = $tw.test.renderGlobal(wiki, text);
	expect(init.calls.first().args[1].nodes).toEqual({to: {}, from: {}});
});

it("generates custom content", function() {
	wiki.addTiddlers([
		{title: "home", tags: "to"},
		{title: "from", tags: "home"},
		{title: "unrelated"}]);
	var text = "<$nodes.neighbors $filter='home'>{{!!title}}-";
	var widget = $tw.test.renderGlobal(wiki, text);
	expect(widget.parentDomNode.innerHTML).toBe("<p>from-to-</p>");
});

it("prevents overlaps", function() {
	wiki.addTiddlers([
		{title: "A", tags: "B C Y"},
		{title: "B", tags: "D"},
		{title: "Z", tags: "A B"},
		{title: "Y", tags: "B"},
		{title: "unrelated"}]);
	var text = "<$nodes.neighbors $filter='A B'>{{!!title}}-";
	var widget = $tw.test.renderGlobal(wiki, text);
	expect(widget.parentDomNode.innerHTML).toBe("<p>Z-C-Y-D-</p>");
});

});
