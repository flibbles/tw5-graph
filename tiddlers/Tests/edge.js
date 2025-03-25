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

});
