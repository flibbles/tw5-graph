/*\

Tests node widgets.

\*/

describe('NodeWidget', function() {

it("gets coordinates from $pos attribute", function() {
	var wiki = new $tw.Wiki();
	var widget;
	widget = $tw.test.renderText(wiki, "<$node $tiddler=N $pos={{Store!!pos}} />\n");
	expect($tw.test.fetchGraphObjects(widget)).toEqual({nodes: {N: {}}});
	// Now we try it again, but the reference actually exists now
	wiki.addTiddler({title: "Store", pos: "13,17"});
	widget = $tw.test.renderText(wiki, "<$node $tiddler=N $pos={{Store!!pos}} />\n");
	expect($tw.test.fetchGraphObjects(widget)).toEqual({nodes: {N: {x: 13, y: 17}}});
});

it("empty-string graph attributes do not count", function() {
	var wiki = new $tw.Wiki();
	var widget = $tw.test.renderText(wiki, "<$node $tiddler=N yes=5 no={{missing}} />");
	expect($tw.test.fetchGraphObjects(widget)).toEqual({nodes: {N: {yes: "5"}}});
});

// TODO: Partial pos attributes
});
