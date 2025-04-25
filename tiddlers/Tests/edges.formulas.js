/*\

Tests the edges.fields global widget.

\*/

describe('edges.formulas \\widget', function() {

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

function  edgeConfig(name, filter, properties) {
	return {
		title: "$:/config/flibbles/graph/edges/formulas/" + name,
		filter: filter,
		text: JSON.stringify(properties || {}),
		type: "application/json"};
};

function nodesFor() {
	return Array.prototype.map.call(arguments, x => `<$node $tiddler="${x}"/>`).join("");
};

it("can make link and transclude edges for graphs", function() {
	wiki.addTiddlers([
		{title: "from", text: "[[toLink1]] [[toLink2]] {{toTransclude}}"}]);
	var text = "<$graph><$edges.formulas $tiddler=from/>" + nodesFor("from", "toLink1", "toLink2", "toTransclude");
	var widget = $tw.test.renderGlobal(wiki, text);
	expect(init).toHaveBeenCalledTimes(1);
	var objects = init.calls.first().args[1];
	expect(Object.values(objects.edges)).toEqual([
		{from: "from", to: "toLink1", label: "links to"},
		{from: "from", to: "toLink2", label: "links to"},
		{from: "from", to: "toTransclude", label: "transcludes"}]);
});

it("can use a custom non-graph block", function() {
	wiki.addTiddler({title: "Target", text: "[[toLink]] {{toTransclude}}"});
	var widget = $tw.test.renderGlobal(wiki, "<$edges.formulas $tiddler=Target>=<<toTiddler>>");
	expect(widget.parentDomNode.innerHTML).toBe("<p>=toLink=toTransclude</p>");
});

it("can hand-pick formulas", function() {
	wiki.addTiddler({title: "Target", text: "[[toLink]] {{toTransclude}}"});
	var widget = $tw.test.renderGlobal(wiki, "<$edges.formulas $formulas=links $tiddler=Target>=<<toTiddler>>");
	expect(widget.parentDomNode.innerHTML).toBe("<p>=toLink</p>");
});

it("can hand-remove formulas", function() {
	wiki.addTiddler({title: "Target", text: "[[toLink]] {{toTransclude}}"});
	var widget = $tw.test.renderGlobal(wiki, "<$edges.formulas $formulas='[all[]] -links' $tiddler=Target>=<<toTiddler>>");
	expect(widget.parentDomNode.innerHTML).toBe("<p>=toTransclude</p>");
});

it("only passes current target to formula filters", function() {
	wiki.addTiddlers([
		{title: "Target", text: "[[toLink]] {{toTransclude}}"},
		{title: "Target2", text: "[[other]] {{bad}}"}]);
	var widget = $tw.test.renderGlobal(wiki, "<$edges.formulas $formulas=links $tiddler=Target>=<<toTiddler>>");
	expect(widget.parentDomNode.innerHTML).toBe("<p>=toLink</p>");
});

it("preserves currentTiddler when running formula filter", function() {
	wiki.addTiddlers([
		edgeConfig("myField", "[{!!myField}]"),
		{title: "Target", myField: "bad"},
		{title: "Template", myField: "good"}]);
	var widget = $tw.test.renderGlobal(wiki, "\\define currentTiddler() Template\n<$edges.formulas $tiddler=Target>=<<toTiddler>>");
	expect(widget.parentDomNode.innerHTML).toBe("<p>=good</p>");
});

it("uses currentTiddler as default", function() {
	wiki.addTiddler({title: "Target", text: "[[toLink]] {{toTransclude}}"});
	var widget = $tw.test.renderGlobal(wiki, "\\define currentTiddler() Target\n<$edges.formulas>=<<toTiddler>>");
	expect(widget.parentDomNode.innerHTML).toBe("<p>=toLink=toTransclude</p>");
});


});
