/*\

Tests the live-graph template

\*/

describe('live-graph template', function() {

var wiki, init, update;

var liveGraph = "$:/plugins/flibbles/graph/templates/live-graph";
var title = "$:/graph/test";

function view(fields) {
	return Object.assign({title: title, template: liveGraph, type: "application/json"}, fields);
};

function functionConfig(name, filter, properties) {
	return {
		title: "$:/config/flibbles/graph/edges/functions/" + name,
		filter: filter,
		text: JSON.stringify(properties || {}),
		type: "application/json"};
};

beforeEach(async function() {
	wiki = new $tw.Wiki();
	({init, update} = $tw.test.setSpies());
	await $tw.test.setGlobals(wiki);
});

it("can properly evaluate function neighbors", function() {
	wiki.addTiddlers([
		view({filter: "target", "neighbors.incoming": "1", "neighbors.outgoing": "1"}),
		functionConfig("nested", "[all[tiddlers]prefix{!!title}]"),
		{title: "target/file"},
		{title: "ignore/file"}]);
	var widget = $tw.test.renderGlobal(wiki, `{{${title}||${liveGraph}}}`);
	var objects = init.calls.first().args[1];
	expect(Object.keys(objects.nodes).sort()).toEqual(["target","target/file"]);
	expect($tw.utils.count(objects.edges)).toBe(1);
});

it("can override graphTiddler node filter", function() {
	wiki.addTiddlers([
		view({filter: "boring", "neighbors.incoming": "1", "neighbors.outgoing": "1", template: liveGraph}),
		{title: "boring", tags: "alsoBoring"},
		{title: "exciting", tags: "alsoExciting"}]);
	var widget = $tw.test.renderGlobal(wiki, `<$graph.view $tiddler="${title}" nodes=exciting />\n`);
	var objects = init.calls.first().args[1];
	expect(Object.keys(objects.nodes).sort()).toEqual(["alsoExciting","exciting"]);
});

});
