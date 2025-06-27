/*\

Tests the nodes.neighbors global widget.

\*/

describe('nodes.neighbors \\widget', function() {

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
	var keys = Object.keys(init.calls.first().args[1].nodes);
	expect(keys).toEqual(["from", "to"]);
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

it("can specify $fields and $formulas for to neighbors", function() {
	wiki.addTiddlers([
		{title: "A"}, {title: "B"}, {title: "C"},
		{title: "L"}, {title: "T"},
		{title: "home", tags: "A B", list: "A C", text: "[[L]] {{T}}"}]);
	var text = "<$nodes.neighbors $filter='home' $fields='[all[]] -tags' $formulas='[all[]] -links'>{{!!title}}-";
	var widget = $tw.test.renderGlobal(wiki, text);
	expect(widget.parentDomNode.innerHTML).toBe("<p>A-C-T-</p>");
});

});
