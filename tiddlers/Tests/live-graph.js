/*\

Tests the live-graph template

\*/

describe('standard-graph template', function() {

var wiki, init, update;

var liveGraph = "$:/plugins/flibbles/graph/templates/live-graph";
var title = "$:/graph/test";

function view(fields) {
	return Object.assign({title: title, template: liveGraph, type: "application/json"}, fields);
};

function formulaConfig(name, filter, properties) {
	return {
		title: "$:/config/flibbles/graph/edges/formulas/" + name,
		filter: filter,
		text: JSON.stringify(properties || {}),
		type: "application/json"};
};

beforeEach(async function() {
	wiki = new $tw.Wiki();
	({init, update} = $tw.test.setSpies());
	await $tw.test.setGlobals(wiki);
});

it("physics only applies to non-recorded nodes", function() {
	wiki.addTiddlers([
		view({filter: "target"}),
		formulaConfig("nested", "[all[tiddlers]prefix{!!title}]"),
		{title: "target/file"},
		{title: "ignore/file"}]);
	var widget = $tw.test.renderGlobal(wiki, `{{${title}||${liveGraph}}}`);
	var objects = init.calls.first().args[1];
	expect(Object.keys(objects.nodes).sort()).toEqual(["target","target/file"]);
	expect($tw.utils.count(objects.edges)).toBe(1);
});

});
