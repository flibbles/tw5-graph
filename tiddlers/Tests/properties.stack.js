/*\

Tests the properties.stack global widget.

\*/

describe('properties.stack \\widget', function() {

var wiki, init, update;
var stackPrefix = "$:/config/flibbles/graph/nodes/stack/";

beforeEach(async function() {
	wiki = new $tw.Wiki();
	({init, update} = $tw.test.setSpies());
	await $tw.test.setGlobals(wiki);
});

function nodeConfig(name, filter, properties) {
	return {
		title: stackPrefix + name,
		text: JSON.stringify(properties),
		filter: filter,
		type: "application/json"};
};

it("applies stack in order", function() {
	wiki.addTiddlers([
		nodeConfig("typeA", "[prefix[X]]", {last: "A", value: "this"}),
		nodeConfig("typeB", "[match[X]]", {last: "B"})]);
	var text = "<$graph><$properties.stack><$list filter='X XY'><$node/>";
	var widget = $tw.test.renderGlobal(wiki, text);
	expect(init).toHaveBeenCalledTimes(1);
	expect(init.calls.first().args[1].nodes).toEqual({
		X: {last: "B", value: "this"},
		XY: {last: "A", value: "this"}});
});

it("can use custom stack order", async function() {
	wiki.addTiddlers([
		nodeConfig("typeA", "[match[X]]", {A: "A", AB: "A", AC: "A"}),
		nodeConfig("typeB", "[match[X]]", {B: "B", AB: "B", BC: "B"}),
		nodeConfig("typeC", "[match[X]]", {C: "C", BC: "C", AC: "C"})]);
	var text = "<$graph><$properties.stack><$node $tiddler=X/>";
	var widget = $tw.test.renderGlobal(wiki, text);
	expect(init.calls.first().args[1].nodes).toEqual({
		X: {A: "A", B: "B", C: "C", AB: "B", AC: "C", BC: "C"}});
	// Now we start customizing the order
	wiki.addTiddler({title: "$:/config/flibbles/graph/nodes/stack",
		list: [stackPrefix + "typeB"]});
	await $tw.test.flushChanges();
	expect(update.calls.first().args[0].nodes).toEqual({
		X: {A: "A", B: "B", C: "C", AB: "A", AC: "C", BC: "C"}});
	// Now fully customize
	update.calls.reset();
	wiki.addTiddler({title: "$:/config/flibbles/graph/nodes/stack",
		list: [stackPrefix + "typeC", stackPrefix + "typeB", stackPrefix + "typeA"]});
	await $tw.test.flushChanges();
	expect(update.calls.first().args[0].nodes).toEqual({
		X: {A: "A", B: "B", C: "C", AB: "A", AC: "A", BC: "B"}});
});

it("ignores deleted stack types in custom sorting", function() {
	wiki.addTiddler(nodeConfig("also"));
	wiki.addTiddler(nodeConfig("present"));
	wiki.addTiddler({title: "$:/config/flibbles/graph/nodes/stack",
		list: [stackPrefix + "missing", stackPrefix + "present"]});
	var text = "<$properties.stack>\n\n<$text text={{{ [subfilter<node.stack>join[ ]] }}} />\n";
	var widget = $tw.test.renderGlobal(wiki, text);
	expect(widget.parentDomNode.innerHTML).toBe(stackPrefix + "present " + stackPrefix + "also");
});

it("can render inline fills", function() {
	var text = "<$properties.stack>* A\n* B";
	var widget = $tw.test.renderGlobal(wiki, text);
	var html = widget.parentDomNode.innerHTML;
	expect(html).toBe("<p>* A\n* B</p>");
});

it("can render block fills", function() {
	var text = "<$properties.stack>\n\n* A\n* B";
	var widget = $tw.test.renderGlobal(wiki, text);
	var html = widget.parentDomNode.innerHTML;
	expect(html).toBe("<ul><li>A</li><li>B</li></ul>");
});

it("does not require same output from filter to qualify", function() {
	wiki.addTiddlers([
		nodeConfig("type", "[get[field]]", {value: "assigned"}),
		{title: "X", field: "value"},
		{title: "Y"}]);
	var text = "<$graph><$properties.stack><$list filter='X Y'><$node/>";
	var widget = $tw.test.renderGlobal(wiki, text);
	expect(init).toHaveBeenCalledTimes(1);
	expect(init.calls.first().args[1].nodes).toEqual({
		X: {value: "assigned"},
		Y: {}});
});

});
