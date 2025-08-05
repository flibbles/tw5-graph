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

it("can specify edge Types for to outgoing neighbors and edges", function() {
	wiki.addTiddlers([
		{title: "A", tags: "A", list: "C"}, {title: "B"}, {title: "C"},
		{title: "T", text: "[[T]] {{X}}"}, {title: "L"}, {title: "X"},
		{title: "home", tags: "A B", list: "A C", text: "[[X]] [[L]] {{X}} {{T}}"}]);
	var text = "<$graph><$nodes.neighbors $filter='home' $interedges=yes $fields='[all[]] -tags' $formulas='[all[]] -links'/>";
	var widget = $tw.test.renderGlobal(wiki, text);
	var objects = init.calls.first().args[1];
	expect(Object.keys(objects.nodes).sort()).toEqual(["A", "C", "T", "X"]);
	expect(Object.values(objects.edges).map((x) => x.to)).toEqual(["C", "X"]);
});

it("can specify edge Types for to incoming neighbors and edges", function() {
	wiki.addTiddlers([
		{title: "home"},
		{title: "A", tags: "home A", list: "home C"},
		{title: "B", tags: "home"},
		{title: "C", list: "home"},
		{title: "X", text: "[[home]] {{home}} [[X]] {{T}}"},
		{title: "L", text: "[[home]]"},
		{title: "T", text: "{{home}}"}]);
	var text = "<$graph><$nodes.neighbors $filter='home' $interedges=yes $fields='[all[]] -tags' $formulas='[all[]] -links'/>";
	var widget = $tw.test.renderGlobal(wiki, text);
	var objects = init.calls.first().args[1];
	expect(Object.keys(objects.nodes).sort()).toEqual(["A", "C", "T", "X"]);
	expect(Object.values(objects.edges).map((x) => x.to)).toEqual(["C", "T"]);
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

it("blank interedges means no interedges", function() {
	// important so views don't always have to be explicit about this value.
	wiki.addTiddlers([
		{title: "target", tags: "C D"},
		{title: "A", tags: "target B"},
		{title: "B", tags: "target"},
		{title: "C", tags: "D"},
		{title: "D"}]);
	var text = "<$graph><$nodes.neighbors $filter=target $interedges='' />";
	var widget = $tw.test.renderGlobal(wiki, text);
	var objects = init.calls.first().args[1];
	expect(objects.edges).toBeUndefined();
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

/*** Case sensitivity ***/
// Three tests for problems found while fixing issue #47

it("handles capitalization mismatch with incoming neighbors", function() {
	wiki.addTiddlers([
		{title: "target"},
		// This shouldn't get removed just because it's similar to focused node
		{title: "Target", tags: "target"},
		{title: "no", tags: "Target"},
		{title: "yes", tags: "target"}]);
	var text = "<$nodes.neighbors $filter=target>{{!!title}}-";
	var widget = $tw.test.renderGlobal(wiki, text);
	expect(widget.parentDomNode.innerHTML).toBe("<p>Target-yes-</p>");
});

// Can't test incoming and outgoing at the same time effectively
it("handles capitalization mismatch with outgoing neighbors", function() {
	wiki.addTiddlers([
		{title: "target", tags: "Target"},
		// This shouldn't get removed just because it's similar to focused node
		{title: "Target"}]);
	var text = "<$nodes.neighbors $filter=target>{{!!title}}-";
	var widget = $tw.test.renderGlobal(wiki, text);
	expect(widget.parentDomNode.innerHTML).toBe("<p>Target-</p>");
});

// Testing edge creation requires creating actual graphs. Can't cheat it.
it("handles capitalization mismatch with neighbor interedges", function() {
	wiki.addTiddlers([
		{title: "target", tags: "Target"},
		// This is pointing to both targets, but the edge to the wrong one
		// shouldn't appear if inter-edges are off.
		{title: "Side", tags: "target Target"},
		{title: "Target"}]);
	var text = "<$graph><$nodes.neighbors $interedges=no $filter=target />";
	var widget = $tw.test.renderGlobal(wiki, text);
	var objects = init.calls.first().args[1];
	expect(Object.keys(objects.nodes).sort()).toEqual(["Side", "Target"]);
	expect(objects.edges).not.toBeDefined();
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
