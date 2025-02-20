/*\

Tests edge widgets.

\*/

describe('EdgeWidget', function() {

it("empty-string graph attributes do not count", function() {
	var wiki = new $tw.Wiki();
	var widget = $tw.test.renderText(wiki, "<$edge from=N yes=5 no={{missing}} />");
	var edgeObjects = $tw.test.fetchGraphObjects(widget).edges;
	expect(Object.values(edgeObjects)).toEqual([{from: "N", yes: "5"}]);
});

});
