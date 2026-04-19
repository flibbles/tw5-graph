/*\

Tests node widgets.

\*/

describe('NodeWidget', function() {

var wiki, window, init, update;

beforeEach(function() {
	wiki = new $tw.Wiki();
	({window, init, update} = $tw.test.setSpies());
});

it("empty-string attributes do not count", function() {
	var widget = $tw.test.renderText(wiki, "<$graph><$node $tiddler=N yes=5 no={{missing}} />");
	var objects = $tw.test.latestEngine.objects;
	expect(objects.nodes).toEqual({N: {yes: "5"}});
});

/*** $tiddler ***/

it("filters out nodes with empty-string ids", async function() {
	var widget = $tw.test.renderText(wiki, "<$graph><$node $tiddler={{ID}}/><$node $tiddler=present />");
	var engine = $tw
	expect(init.calls.first().args[1].nodes).toEqual({present: {}});
	wiki.addTiddler({title: "ID", text: "added"});
	await $tw.test.flushChanges();
	// present should not be refreshed, even though it's got a new index
	// because the TestAdapter does not track indexes
	expect(update.calls.first().args[0].nodes).toEqual({added: {}});
	// Now blank it again and make sure it removes correctly
	update.calls.reset();
	wiki.deleteTiddler("ID");
	await $tw.test.flushChanges();
	expect(update.calls.first().args[0].nodes).toEqual({added: null});
});

/*** $pos, x, and y ***/

it("gets coordinates from $pos attribute", function() {
	var widget;
	widget = $tw.test.renderText(wiki, "<$graph><$node $tiddler=N $pos={{Store!!pos}} />\n");
	expect($tw.test.latestEngine.objects.nodes).toEqual({N: {}});
	// Now we try it again, but the reference actually exists now
	wiki.addTiddler({title: "Store", pos: "13,17"});
	widget = $tw.test.renderText(wiki, "<$graph><$node $tiddler=N $pos={{Store!!pos}} />\n");
	expect($tw.test.latestEngine.objects.nodes).toEqual({N: {x: 13, y: 17}});
});

it("$pos respects engine settings for coordinates", function() {
	var spies = $tw.test.spyOnAdapter("Also");
	spies.testRules("nodes", {
		x: {type: "string", hidden: true},
		y: {type: "number", hidden: true},
		z: {type: "string", hidden: true}
	});
	var widget = $tw.test.renderText(wiki, "<$graph $engine=Also><$node $tiddler=N $pos='0,0,five' />");
	// The important thing here is that the numbers are strings,
	// because the AlsoEngine does not describe x or y as numbers.
	var objects = spies.init.calls.first().args[1];
	expect(objects.nodes).toEqual({N: {x: '0', y: 0, z: 'five'}});
});

it("$pos treats 0 not as falsey, and still triggers refresh", async function() {
	// setting to 0,0 was not properly updating. Turns out it was a Vis issue.
	wiki.addTiddler({title: "Store", text: "5,7"});
	await $tw.test.flushChanges();
	var widget = $tw.test.renderText(wiki, "<$graph><$node $tiddler=N $pos={{Store}} />\n");
	expect(init.calls.first().args[1].nodes).toEqual({N: {x: 5, y: 7}});
	wiki.addTiddler({title: "Store", text: "0,0"});
	await $tw.test.flushChanges();
	expect(update).toHaveBeenCalled();
	expect(update.calls.first().args[0]).toEqual({nodes: {N: {x: 0, y: 0}}});
});

it("get handle partial coordinates from $pos attribute", function() {
	wiki.addTiddler({title: "Store", pos: "13"});
	var widget = $tw.test.renderText(wiki, "<$graph><$node $tiddler=N $pos={{Store!!pos}} />\n");
	expect($tw.test.latestEngine.objects.nodes).toEqual({N: {x: 13}});
	wiki.addTiddler({title: "Store", pos: ",17"});
	var widget = $tw.test.renderText(wiki, "<$graph><$node $tiddler=N $pos={{Store!!pos}} />\n");
	expect($tw.test.latestEngine.objects.nodes).toEqual({N: {y: 17}});
});

it("ignores non-number coordinates in $pos", function() {
	// This isn't really ideal, but I figure if they're giving bad numbers
	// overriding good, the problem is really in their court anyway.
	wiki.addTiddler({title: "Store", pos: "string,11"});
	var widget = $tw.test.renderText(wiki, "<$graph><$node $tiddler=N $pos={{Store!!pos}} />\n");
	expect($tw.test.latestEngine.objects.nodes).toEqual({N: {y: 11}});
});

it("non-number coordinates override good numbers", function() {
	// This isn't really ideal, but I figure if they're giving bad numbers
	// overriding good, the problem is really in their court anyway.
	wiki.addTiddler({title: "Store", pos: "7,11", y: "nan"});
	var widget = $tw.test.renderText(wiki, "<$graph><$node $tiddler=N $pos={{Store!!pos}} x={{Store!!x}} y={{Store!!y}} />\n");
	expect($tw.test.latestEngine.objects.nodes).toEqual({N: {x: 7}});
});

it("prefers explicit axis values over $pos", function() {
	wiki.addTiddler({title: "Store", pos: "13,11", y: "7.5"});
	var widget = $tw.test.renderText(wiki, "<$graph><$node $tiddler=N $pos={{Store!!pos}} x={{Store!!x}} y={{Store!!y}} />\n");
	expect($tw.test.latestEngine.objects.nodes).toEqual({N: {x: 13, y: 7.5}});
});

/*** $index ***/

it("does not refresh indices when index not tracked", async function() {
	await $tw.test.flushChanges();
	var widget = $tw.test.renderText(wiki, "<$graph><$list filter='[enlist{Nodes}]'><$node/></$list><$node $tiddler=N $pos={{Store}} />\n");
	expect(init.calls.first().args[1].nodes).toEqual({N: {}});
	wiki.addTiddler({title: "Nodes", text: "A"});
	await $tw.test.flushChanges();
	expect(update).toHaveBeenCalled();
	// N does not reappear
	expect(update.calls.first().args[0]).toEqual({nodes: {A: {}}});
});

it("does refresh indices when index are tracked", async function() {
	var spies = $tw.test.spyOnAdapter("Also");
	spies.testRules("nodes", {
		index: {type: "number", hidden: true}
	});
	await $tw.test.flushChanges();
	var widget = $tw.test.renderText(wiki, "<$graph $engine=Also><$list filter='[enlist{Nodes}]'><$node/></$list><$node $tiddler=N $pos={{Store}} />\n");
	expect(spies.init.calls.first().args[1].nodes).toEqual({N: {index: 0}});
	wiki.addTiddler({title: "Nodes", text: "A"});
	await $tw.test.flushChanges();
	expect(spies.update).toHaveBeenCalled();
	// N does reappear with a new index
	var objects = spies.update.calls.first().args[0];
	expect(objects).toEqual({nodes: {
		A: {index: 0},
		N: {index: 1}}});
});

});
