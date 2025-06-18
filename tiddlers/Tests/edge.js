/*\

Tests edge widgets.

\*/

describe('EdgeWidget', function() {

var wiki, window;

beforeEach(function() {
	wiki = new $tw.Wiki();
	({window, update} = $tw.test.setSpies());
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

/*** $id ***/

it("handles blank id by assigning", function() {
	var widget = $tw.test.renderText(wiki, "<$graph><$node $tiddler=A><$edge $from=A $to=A $id='' />");
	var edges = $tw.test.latestEngine.objects.edges;
	var id = Object.keys(edges)[0];
	expect(id).not.toBeFalsy();
	expect(edges).toEqual({[id]: {from: "A", to: "A"}});
});

it("can preserve existing $id when updating ids", async function() {
	wiki.addTiddler({title: "value", text: "first"});
	var widget = $tw.test.renderText(wiki, "<$graph><$list filter='[{value}]'><$node $tiddler=A><$node $tiddler=B/><$edge $from=A $to=B value=<<currentTiddler>> $id=fixed />");
	var oldEdges = $tw.test.latestEngine.objects.edges;
	var oldId = Object.keys(oldEdges)[0];
	expect(oldEdges).toEqual({[oldId]: {from: "A", to: "B", value: "first"}});
	// Now we change it.
	wiki.addTiddler({title: "value", text: "second"});
	await $tw.test.flushChanges();
	var newEdges = $tw.test.latestEngine.objects.edges;
	expect(newEdges).toEqual({[oldId]: {from: "A", to: "B", value: "second"}});
});

it("can preserve existing $id when adding new edges", async function() {
	wiki.addTiddler({title: "value", list: "X Y"});
	var widget = $tw.test.renderText(wiki, `<$graph>
	  <$node $tiddler=A><$node $tiddler=B/>
	  <$list counter=counter filter='[list[value]]'>
	    <$edge $from=A $to=B $id=<<currentTiddler>> value=<<counter>> />`);
	var oldEdges = $tw.test.latestEngine.objects.edges;
	expect(oldEdges).toEqual({
		X: {from: "A", to: "B", value: "1"},
		Y: {from: "A", to: "B", value: "2"}});
	// Now we change it.
	wiki.addTiddler({title: "value", list: "X Y Z"});
	await $tw.test.flushChanges();
	var objects = update.calls.first().args[0];
	var newEdges = objects.edges
	// The last item will refresh itself because that's how $list works
	// when counter tracking is enabled. Small overhead.
	expect(newEdges).toEqual({
		Y: {from: "A", to: "B", value: "2"},
		Z: {from: "A", to: "B", value: "3"}});
});

});
