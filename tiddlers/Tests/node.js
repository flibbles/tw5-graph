/*\

Tests node widgets.

\*/

describe('NodeWidget', function() {

var window;

beforeEach(function() {
	({window} = $tw.test.setSpies());
});

it("gets coordinates from $pos attribute", function() {
	var wiki = new $tw.Wiki();
	var widget;
	widget = $tw.test.renderText(wiki, "<$graph><$node $tiddler=N $pos={{Store!!pos}} />\n");
	expect($tw.test.latestEngine.objects.nodes).toEqual({N: {}});
	// Now we try it again, but the reference actually exists now
	wiki.addTiddler({title: "Store", pos: "13,17"});
	widget = $tw.test.renderText(wiki, "<$graph><$node $tiddler=N $pos={{Store!!pos}} />\n");
	expect($tw.test.latestEngine.objects.nodes).toEqual({N: {x: 13, y: 17}});
});

it("pos respects engine settings for coordinates", function() {
	var wiki = new $tw.Wiki();
	var widget = $tw.test.renderText(wiki, "<$graph $engine=Also><$node $tiddler=N $pos='0,,five' />");
	// The important thing here is that the numbers are strings, because the AlsoEngine does not describe x or y as numbers.
	expect($tw.test.latestEngine.objects.nodes).toEqual({N: {x: '0', z: 'five'}});
});

it("get handle partial coordinates from $pos attribute", function() {
	var wiki = new $tw.Wiki();
	wiki.addTiddler({title: "Store", pos: "13"});
	var widget = $tw.test.renderText(wiki, "<$graph><$node $tiddler=N $pos={{Store!!pos}} />\n");
	expect($tw.test.latestEngine.objects.nodes).toEqual({N: {x: 13}});
	wiki.addTiddler({title: "Store", pos: ",17"});
	var widget = $tw.test.renderText(wiki, "<$graph><$node $tiddler=N $pos={{Store!!pos}} />\n");
	expect($tw.test.latestEngine.objects.nodes).toEqual({N: {y: 17}});
});

it("ignores non-number coordinates", function() {
	var wiki = new $tw.Wiki();
	wiki.addTiddler({title: "Store", pos: "string,11", y: "nan"});
	var widget = $tw.test.renderText(wiki, "<$graph><$node $tiddler=N $pos={{Store!!pos}} x={{Store!!x}} y={{Store!!y}} />\n");
	expect($tw.test.latestEngine.objects.nodes).toEqual({N: {y: 11}});
});

it("prefers explicit axis values over $pos", function() {
	var wiki = new $tw.Wiki();
	wiki.addTiddler({title: "Store", pos: "13,11", y: "7.5"});
	var widget = $tw.test.renderText(wiki, "<$graph><$node $tiddler=N $pos={{Store!!pos}} x={{Store!!x}} y={{Store!!y}} />\n");
	expect($tw.test.latestEngine.objects.nodes).toEqual({N: {x: 13, y: 7.5}});
});

it("empty-string graph attributes do not count", function() {
	var wiki = new $tw.Wiki();
	var widget = $tw.test.renderText(wiki, "<$node $tiddler=N yes=5 no={{missing}} />");
	expect($tw.test.fetchGraphObjects(widget)).toEqual({nodes: {N: {yes: "5"}}});
});

});
