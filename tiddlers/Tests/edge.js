/*\

Tests edge widgets.

\*/

describe('EdgeWidget', function() {

var wiki, window;

beforeEach(function() {
	wiki = new $tw.Wiki();
	({window} = $tw.test.setSpies());
});

it("empty-string graph attributes do not count", function() {
	var widget = $tw.test.renderText(wiki, "<$edge $from=N yes=5 no={{missing}} />");
	var edgeObjects = $tw.test.fetchGraphObjects(widget).edges;
	expect(Object.values(edgeObjects)).toEqual([{from: "N", yes: "5"}]);
});

it("ignores bad numbers for number properties", function() {
	var widget = $tw.test.renderText(wiki, "<$graph><$node $tiddler=A><$node $tiddler=B><$edge $from=A $to=B width=bad />");
	expect(Object.values($tw.test.latestEngine.objects.edges)).toEqual([{from: "A", to: "B"}]);
});

it("can take 'to' node from toTiddler variable", function() {
	var widget = $tw.test.renderText(wiki, "\\define toTiddler() B\n<$graph><$node $tiddler=A><$node $tiddler=B><$edge $from=A />");
	expect(Object.values($tw.test.latestEngine.objects.edges)).toEqual([{from: "A", to: "B"}]);
});

it("updates but doesn't refresh if $from changes", async function() {
	wiki.addTiddler({title: "from", text: "A"});
	var widget = $tw.test.renderText(wiki, "<$graph><$node $tiddler=A><$node $tiddler=B><$edge $from={{from}} $to=B />");
	await $tw.test.flushChanges();
	var oldEdges = $tw.test.latestEngine.objects.edges;
	var oldId = Object.keys(oldEdges)[0];
	expect(oldEdges[oldId]).toEqual({from: "A", to: "B"});
	wiki.addTiddler({title: "from", text: "B"});
	await $tw.test.flushChanges();
	var newEdges = $tw.test.latestEngine.objects.edges;
	expect(newEdges).toEqual({[oldId]: {from: "B", to: "B"}});
});

it("updates but doesn't refresh if $to changes", async function() {
	wiki.addTiddler({title: "to", text: "A"});
	var widget = $tw.test.renderText(wiki, "<$graph><$node $tiddler=A><$node $tiddler=B><$edge $from=A $to={{to}} />");
	await $tw.test.flushChanges();
	var oldEdges = $tw.test.latestEngine.objects.edges;
	var oldId = Object.keys(oldEdges)[0];
	expect(oldEdges[oldId]).toEqual({from: "A", to: "A"});
	wiki.addTiddler({title: "to", text: "B"});
	await $tw.test.flushChanges();
	var newEdges = $tw.test.latestEngine.objects.edges;
	expect(newEdges[oldId]).toEqual({from: "A", to: "B"});
});

});
