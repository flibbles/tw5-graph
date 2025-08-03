/*\

Tests the nodes.neighbors global widget.

\*/

describe('nodes.neighbors \\widget', function() {

var wiki, init, update;

beforeEach(async function() {
	wiki = new $tw.Wiki();
	({init, update} = $tw.test.setSpies());
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
	expect(widget.parentDomNode.innerHTML).toBe("<p>Y-Z-C-D-</p>");
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

it("can optionally create inter-edges", async function() {
	var label = "tagged with";
	wiki.addTiddlers([
		{title: "Inter", text: "no"},
		{title: "C", tags: "NW NE"},
		{title: "NW", tags: "NE"}, {title: "NE", tags: "SE"},
		{title: "SW", tags: "C NW"}, {title: "SE", tags: "C SW"},
		{title: "unused", tags: "NE NW SW SE"}]);
	var text = "<$graph><$node $tiddler=C/><$nodes.neighbors $filter='C' $interedges={{Inter}} />";
	await $tw.test.flushChanges();
	var widget = $tw.test.renderGlobal(wiki, text);
	var objects = init.calls.first().args[1];
	expect(widget.parentDomNode.textContent).toBe("");
	expect(objects.nodes).toEqual({C: {},
		NW:{label: "NW"}, NE:{label: "NE"},
		SW:{label: "SW"}, SE:{label: "SE"}});
	expect(Object.values(objects.edges)).toEqual([
		{from: "SE", to: "C", label: label},
		{from: "SW", to: "C", label: label}]);
	// Now we'll turn inter-neighbors on
	wiki.addTiddler({title: "Inter", text: "yes"});
	await $tw.test.flushChanges();
	expect(update).toHaveBeenCalledTimes(1);
	objects = update.calls.first().args[0];
	expect(Object.values(objects.edges)).toEqual([
		{from: "SE", to: "C", label: label},
		{from: "SW", to: "C", label: label},
		{from: "SE", to: "SW", label: label},
		{from: "SW", to: "NW", label: label},
		{from: "NW", to: "NE", label: label},
		{from: "NE", to: "SE", label: label}]);
});

it("can whitelist out system tiddlers by default", function() {
	wiki.addTiddlers([
		{title: "A", tags: "home"}, {title: "B"},
		{title: "$:/C", tags: "home"}, {title: "$:/D"},
		{title: "home", tags: "B $:/D"}]);
	var text = "<$nodes.neighbors $filter='home'>{{!!title}}-";
	var widget = $tw.test.renderGlobal(wiki, text);
	expect(widget.parentDomNode.innerHTML).toBe("<p>A-B-</p>");
});

it("can whitelist out custom tiddlers", function() {
	wiki.addTiddlers([
		{title: "A", tags: "home node"}, {title: "B", tags: "node"},
		{title: "C", tags: "home"}, {title: "D"},
		{title: "home", tags: "B D"}]);
	var text = "<$nodes.neighbors $filter='home' $whitelist='[tag[node]]'>{{!!title}}-";
	var widget = $tw.test.renderGlobal(wiki, text);
	expect(widget.parentDomNode.innerHTML).toBe("<p>A-B-</p>");
});

it("gets [all[tiddlers] as source for $filter", function() {
	wiki.addTiddler({title: "A", tags: "node", list: "B C D"});
	var text = "<$nodes.neighbors $filter='[tag[node]]'>{{!!title}}-";
	var widget = $tw.test.renderGlobal(wiki, text);
	expect(widget.parentDomNode.innerHTML).toBe("<p>B-C-D-node-</p>");
});

// Tests for issue #47
it("properly sets currentTiddler when seeking for neighbors", function() {
	wiki.addTiddler({
		title: "$:/config/flibbles/graph/edges/formulas/directory",
		filter: "[all[tiddlers]prefix<currentTiddler>] -[all[current]]"});
	wiki.addTiddler({title: "$:/config/flibbles/graph/edges/fields/filter"});
	wiki.addTiddler({title: "$:/config/flibbles/relink/fields/filter", text: "filter"});
	wiki.addTiddlers([
		{title: "Dir/Target", filter: "[all[current]get[field]]", field: "to"},
		// Test fields incoming
		{title: "from", filter: "[all[current]get[field]]", field:"Dir/Target"},
		// Test fields outgoin
		{title: "to"},
		// Test formulas outgoing
		{title: "Dir/Target/A"},
		// Test formulas incoming
		{title: "Dir"},
		// Test that this doesn't get picked up
		{title: "Obligatory ignored tiddler"}]);
	var text = "<$nodes.neighbors $filter='Dir/Target'>{{!!title}}-";
	var widget = $tw.test.renderGlobal(wiki, text);
	expect(widget.parentDomNode.innerHTML).toBe("<p>Dir-from-to-Dir/Target/A-</p>");
});

});
