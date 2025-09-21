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

it("exposes raw blocks once", function() {
	wiki.addTiddler({title: title, filter: "A B", "graph.nodes": '{"color": "#00ff00"}'});
	var widget = $tw.test.renderGlobal(wiki, `<$tiddler tiddler="${title}"><$transclude $tiddler="${liveGraph}">MyContent<$node $tiddler=X/>`);
	var objects = init.calls.first().args[1];
	// The filter nodes should be there, and our custom one too.
	expect(Object.keys(objects.nodes).sort()).toEqual(["A", "B", "X"]);
	// The custom block was inside of our $property widgets, and so picked up
	// our graphTiddler.
	expect(objects.nodes.X.color).toBe("#00ff00");
	// Our custom content should only have showed up once.
	// So when splitting by it, we should end up with only two parts.
	expect(widget.parentDomNode.innerHTML.split("MyContent").length).toBe(2);
});

it("fully refreshes when its nodes change", async function() {
	// Vis-Network and other graphs are better able to present fresh data
	// if it does so fresh, rather than updating an existing graph.
	wiki.addTiddlers([
		view({filter: "[subfilter{Target}]"}),
		{title: "Target", text: "Always TiddlerA"}]);
	var widget = $tw.test.renderGlobal(wiki, `{{${title}||${liveGraph}}}`);
	expect(init).toHaveBeenCalled();
	expect(Object.keys(init.calls.first().args[1].nodes)).toEqual(["Always", "TiddlerA"]);
	// Now change the targetted tiddler.
	// This should result in a full graph refresh, not an update.
	init.calls.reset();
	// "Always" always stays in the list, and as first. This makes sure we're
	// not just using the first tiddler in the node list to look for changes.
	wiki.addTiddler({title: "Target", text: "Always TiddlerB"});
	await $tw.test.flushChanges();
	expect(init).toHaveBeenCalled();
	expect(update).not.toHaveBeenCalled();
	expect(Object.keys(init.calls.first().args[1].nodes)).toEqual(["Always", "TiddlerB"]);
});

});
