/*\

Tests the edges.typed global widget.

\*/

describe('edges.typed \\widget', function() {

var wiki, init;

beforeEach(async function() {
	wiki = new $tw.Wiki();
	({init} = $tw.test.setSpies());
	var pluginInfo = $tw.wiki.getPluginInfo("$:/plugins/flibbles/graph");
	wiki.addTiddlers(Object.values(pluginInfo.tiddlers));
	wiki.addTiddler($tw.wiki.getTiddler("$:/core/config/GlobalImportFilter"));
	// TODO: I'd love to not have to do this, but I need a getGraphObjects
	// that works and doesn't go out of date when I make core plugin changes.
	await $tw.test.flushChanges();
});

function relinkConfig(name, type) {
	return {title: "$:/config/flibbles/relink/fields/" + name, text: type};
};

function  edgeConfig(name, properties) {
	return {
		title: "$:/config/flibbles/graph/edges/" + name,
		text: JSON.stringify(properties),
		type: "application/json"};
};

function nodesFor() {
	return Array.prototype.map.call(arguments, x => `<$node $tiddler="${x}"/>`).join("");
};

it("uses all fieldTyped edges when no fields specified", function() {
	wiki.addTiddlers([
		edgeConfig("fieldA", {value: "A"}),
		edgeConfig("fieldB", {value: "B"}),
		relinkConfig("fieldA", "title"),
		{title: "from", fieldA: "to this", fieldB: "to this"}]);
	var text = "<$graph><$edges.typed $tiddler=from/>" + nodesFor("from", "to", "this", "to this");
	var widget = $tw.test.renderGlobal(wiki, text);
	expect(init).toHaveBeenCalledTimes(1);
	var objects = init.calls.first().args[1];
	expect(Object.values(objects.edges)).toEqual([
		{from: "from", to: "to this", value: "A"},
		{from: "from", to: "to", value: "B"},
		{from: "from", to: "this", value: "B"}]);
});

it("handles non-fieldTyped edges when specified", function() {
	wiki.addTiddlers([
		edgeConfig("fieldA", {value: "A"}),
		edgeConfig("fieldB", {value: "B"}),
		relinkConfig("fieldA", "title"),
		{title: "from", fieldA: "to this", fieldB: "to this", fieldC: "C D"}]);
	var text = "<$graph><$edges.typed $fields='fieldB fieldC' $tiddler=from/>" + nodesFor("from", "to", "this", "to this", "C", "D");
	var widget = $tw.test.renderGlobal(wiki, text);
	var objects = init.calls.first().args[1];
	expect(Object.values(objects.edges)).toEqual([
		{from: "from", to: "to", value: "B"},
		{from: "from", to: "this", value: "B"},
		{from: "from", to: "C"},
		{from: "from", to: "D"}]);
});

it("can have custom edge fill", function() {
	wiki.addTiddlers([
		edgeConfig("fieldA", {value: "A", other: "val"}),
		{title: "from", fieldA: "to"}]);
	var text = "<$graph><$edges.typed $tiddler=from><$edge value=custom/></$edges.typed>" + nodesFor("from", "to");
	var widget = $tw.test.renderGlobal(wiki, text);
	var objects = init.calls.first().args[1];
	expect(Object.values(objects.edges)).toEqual([
		{from: "from", to: "to", value: "custom", other: "val"}]);
});

it("currentTiddler remains unchanged for $fields filter", function() {
	wiki.addTiddlers([
		{title: "Info", choice: "fieldB"},
		{title: "from", fieldA: "bad", fieldB: "good"}]);
	var text = "\\define currentTiddler() Info\n<$graph><$edges.typed $fields='[<currentTiddler>get[choice]]' $tiddler=from/>" + nodesFor("from", "bad", "good");
	var widget = $tw.test.renderGlobal(wiki, text);
	var objects = init.calls.first().args[1];
	expect(Object.values(objects.edges)).toEqual([
		{from: "from", to: "good"}]);
});

it("can delete edges", function() {
	wiki.addTiddlers([
		edgeConfig("fieldA", {value: "A"}),
		relinkConfig("fieldA", "title"),
		{title: "$:/config/TimestampDisable", text: "yes"},
		{title: "from", fieldA: "to there"}]);
	var text = "<$graph><$edges.typed $editable=yes $tiddler=from/>" + nodesFor("from", "to there");
	var widget = $tw.test.renderGlobal(wiki, text);
	var edges = $tw.test.latestEngine.objects.edges;
	var id = Object.keys(edges)[0];
	expect(edges[id]).toEqual({from: "from", to: "to there", value: "A", delete: true});
	$tw.test.dispatchEvent(wiki, {objectType: "edges", id: id, type: "delete"}, {});
	expect(wiki.getTiddler("from").fields).toEqual({title: "from"});
	
});

it("can update edges when type is changed", async function() {
	wiki.addTiddlers([
		edgeConfig("fieldA", {value: "A"}),
		{title: "from", fieldA: "[[to there]]"}]);
	var text = "<$graph><$edges.typed $tiddler=from/>" + nodesFor("from", "to there");
	var widget = $tw.test.renderGlobal(wiki, text);
	await $tw.test.flushChanges();
	var edges = $tw.test.latestEngine.objects.edges;
	var id = Object.keys(edges)[0];
	expect(edges[id]).toEqual({from: "from", to: "to there", value: "A"});
	// Now changes the type
	wiki.addTiddler(edgeConfig("fieldA", {value: "B"}));
	await $tw.test.flushChanges();
	edges = $tw.test.latestEngine.objects.edges;
	// The id should remain the same, because we don't do a full refresh
	expect(edges).toEqual({[id]: {from: "from", to: "to there", value: "B"}});
});

});
