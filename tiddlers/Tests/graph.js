/*\

Tests that graphs properly refresh.

\*/

describe('GraphWidget', function() {

function clean(objects) {
	objects.edges = Object.values(objects.edges);
	return objects;
};

function onlyCallOf(spy) {
	expect(spy).toHaveBeenCalledTimes(1);
	return spy.calls.first().args;
};

it('handles updates to nodes', async function() {
	var update = spyOn($tw.test.adapter, "update").and.callThrough();
	var wiki = new $tw.Wiki();
	wiki.addTiddlers([
		{title: "A", tags: "node"},
		{title: "B", tags: "node"},
		{title: "C", tags: "node"},
		{title: "D", tags: "node"}]);
	var widgetNode = $tw.test.renderText(wiki, "<$graph><$list filter='[tag[node]]'><$node label={{!!caption}} />");
	await $tw.test.flushChanges();
	expect($tw.test.latestEngine.objects.nodes).toEqual({ A: {}, B: {}, C: {}, D: {}});
	// Now we add and remove a node to the graph
	wiki.addTiddlers([
		{title: "B2", tags: "node"},
		{title: "B"},
		{title: "C", tags: "node", caption: "Ccaption"}]);
	await $tw.test.flushChanges();
	expect(update).toHaveBeenCalledTimes(1);
	expect(update).toHaveBeenCalledWith({nodes: {B: null, B2: {}, C: {label: "Ccaption"}}});
});

it('handles updates to edges', async function() {
	var update = spyOn($tw.test.adapter, "update").and.callThrough();
	var wiki = new $tw.Wiki();
	wiki.addTiddlers([
		{title: "A", tags: "node"},
		{title: "B", tags: "node", list: "A"},
		{title: "C", tags: "node"},
		{title: "D", tags: "node", list: "A B"}]);
	var widgetNode = $tw.test.renderText(wiki, "<$graph><$list filter='[tag[node]]'><$node /><$list variable=to filter='[list[]]'><$edge to=<<to>> label={{!!toLabel}} />");
	await $tw.test.flushChanges();
	expect(Object.values($tw.test.latestEngine.objects.edges)).toEqual([
		{from: "B", to: "A"}, {from: "D", to: "A"}, {from: "D", to: "B"}]);
	// Now we add and remove a node to the graph
	wiki.addTiddlers([
		{title: "B", tags: "node", list: "A", toLabel: "newLabel"},
		{title: "D", tags: "node", list: "A C"}]);
	await $tw.test.flushChanges();
	expect(update).toHaveBeenCalledTimes(1);
	expect(clean(update.calls.first().args[0])).toEqual({edges: [
		{from: "B", to: "A", label: "newLabel"},
		null,
		{from: "D", to: "C"}]});
	expect(Object.values($tw.test.latestEngine.objects.edges)).toEqual([
		{from: "B", to: "A", label: "newLabel"},
		{from: "D", to: "A"},
		null,
		{from: "D", to: "C"}]);
});

it('handles incomplete edges completed later', async function() {
	var update = spyOn($tw.test.adapter, "update").and.callThrough();
	var wiki = new $tw.Wiki();
	wiki.addTiddlers([
		{title: "A", tags: "node"},
		{title: "B"}]);
	var widgetNode = $tw.test.renderText(wiki, "<$graph><$list filter='[tag[node]]'><$node /></$list><$edge from=A to=B />");
	await $tw.test.flushChanges();
	var objects = $tw.test.latestEngine.objects;
	expect(objects.nodes).toEqual({A:{}});
	expect(objects.edges).toBeUndefined();
	wiki.addTiddler({title: "B", tags: "node"});
	await $tw.test.flushChanges();
	var cleanedArgs = clean(onlyCallOf(update)[0]);
	expect(cleanedArgs).toEqual({nodes: {B: {}}, edges: [{from: "A", to:"B"}]});
});

it('handles edge getting incompleted later', async function() {
	var update = spyOn($tw.test.adapter, "update").and.callThrough();
	var wiki = new $tw.Wiki();
	wiki.addTiddlers([
		{title: "A", tags: "node"},
		{title: "B", tags: "node"}]);
	var widgetNode = $tw.test.renderText(wiki, "<$graph><$list filter='[tag[node]]'><$node /></$list><$edge from=A to=B />");
	await $tw.test.flushChanges();
	var objects = clean($tw.test.latestEngine.objects);
	expect(objects.nodes).toEqual({A:{}, B:{}});
	expect(objects.edges).toEqual([{from: "A", to: "B"}]);
	wiki.addTiddler({title: "B"});
	await $tw.test.flushChanges();
	var cleanedArgs = clean(onlyCallOf(update)[0]);
	expect(cleanedArgs).toEqual({nodes: {B: null}, edges: [null]});
});

it('does not hand over empty edge lists', function() {
	var init = spyOn($tw.test.adapter, "init").and.callThrough();
	var wiki = new $tw.Wiki();
	wiki.addTiddler({title: "A"});
	var widgetNode = $tw.test.renderText(wiki, "<$graph><$node $tiddler=A/><$edge from=A to=B />");
	expect(init).toHaveBeenCalledTimes(1);
	// Might expect to have an edge object because one was added,
	// and then trimmed. But we should be better than that.
	var objects = init.calls.first().args[1];
	expect(objects.nodes).toEqual({A: {}});
	expect(objects.edges).toBeUndefined();
});

it('does not send update if no graph objects changed', async function() {
	var update = spyOn($tw.test.adapter, "update").and.callThrough();
	var wiki = new $tw.Wiki();
	wiki.addTiddlers([{title: "A"},{title: "Other"}]);
	var widgetNode = $tw.test.renderText(wiki, "<$graph>{{Other}}");
	wiki.addTiddler({title: "Other", text: "New content"});
	await $tw.test.flushChanges();
	expect(update).not.toHaveBeenCalled();
});

/*** dimensions ***/

it("does not bother refreshing for dimension changes", async function() {
	var init = spyOn($tw.test.adapter, "init").and.callThrough();
	var update = spyOn($tw.test.adapter, "update").and.callThrough();
	var wiki = new $tw.Wiki();
	wiki.addTiddler({title: "dimensions", text: "247"});
	var widgetNode = $tw.test.renderText(wiki, "<$graph $height={{dimensions}} $width={{dimensions}}>\n\n<$node $tiddler=A/>\n");
	await $tw.test.flushChanges();
	expect(init).toHaveBeenCalled();
	expect(widgetNode.parentDomNode.innerHTML).toContain("height:247");
	expect(widgetNode.parentDomNode.innerHTML).toContain("width:247");
	wiki.addTiddler({title: "dimensions", text: "300"});
	await $tw.test.flushChanges();
	expect(update).not.toHaveBeenCalled();
	expect(widgetNode.parentDomNode.innerHTML).toContain("height:300");
	expect(widgetNode.parentDomNode.innerHTML).toContain("width:300");
});

/*** color palette ***/

it('sends style update if palette changes', async function() {
	var update = spyOn($tw.test.adapter, "update").and.callThrough();
	var init = spyOn($tw.test.adapter, "init").and.callThrough();
	var wiki = new $tw.Wiki();
	wiki.addTiddler({title: "graph-node-background", text: "#ff0000"});
	var widgetNode = $tw.test.renderText(wiki, '\\define colour(name) <$transclude $tiddler="$name$">#000000</$transclude>\n<$graph/>')
	await $tw.test.flushChanges();
	var initialObjects = onlyCallOf(init)[1];
	expect(Object.keys(initialObjects)).toEqual(["style"]);
	expect(initialObjects.style.nodeBackground).toBe("#ff0000");
	// Now we make a change
	wiki.addTiddler({title: "graph-node-background", text: "#0000ff"});
	await $tw.test.flushChanges();
	var newObjects = onlyCallOf(update)[0];
	expect(Object.keys(newObjects)).toEqual(["style"]);
	expect(newObjects.style.nodeBackground).toBe("#0000ff");
});

it('sends style and node updates together', async function() {
	var update = spyOn($tw.test.adapter, "update").and.callThrough();
	var init = spyOn($tw.test.adapter, "init").and.callThrough();
	var wiki = new $tw.Wiki();
	wiki.addTiddler({title: "graph-node-background", text: "#ff0000"});
	var widgetNode = $tw.test.renderText(wiki, '\\define colour(name) <$transclude $tiddler="$name$">#000000</$transclude>\n<$graph><$node $tiddler=N label={{graph-node-background}} />')
	await $tw.test.flushChanges();
	var initialObjects = onlyCallOf(init)[1];
	expect(Object.keys(initialObjects)).toEqual(["nodes", "style"]);
	expect(initialObjects.style.nodeBackground).toBe("#ff0000");
	// Now we make a change
	wiki.addTiddler({title: "graph-node-background", text: "#0000ff"});
	await $tw.test.flushChanges();
	var newObjects = onlyCallOf(update)[0];
	expect(Object.keys(newObjects)).toEqual(["nodes", "style"]);
	expect(newObjects.style.nodeBackground).toBe("#0000ff");
	expect(newObjects.nodes.N).toEqual({label: "#0000ff"});
});

/*** $engine attribute ***/

// TODO: Also make it not refresh if global setting gets set, but doesn't change outcome? Maybe too much?
it("uses first available engine if none specified", function() {
	var wiki = new $tw.Wiki();
	var utils = require("$:/plugins/flibbles/graph/utils.js");
	var First = function() {};
	First.prototype.init = function(){};
	First.prototype.render = function(){};
	spyOn(utils, "getEngineMap").and.returnValue({anything: First});
	var alsoInit = spyOn(First.prototype, "init");
	var text = wiki.renderText("text/html", "text/vnd.tiddlywiki", "<$graph/>")
	expect(alsoInit).toHaveBeenCalled();
});

it("does not let blank $engine value override settings", function() {
	var wiki = new $tw.Wiki();
	wiki.addTiddler({title: "$:/config/flibbles/graph/engine", text: "Test"});
	var testInit = spyOn($tw.test.adapter, "init");
	var text = wiki.renderText("text/html", "text/vnd.tiddlywiki", "<$graph $engine={{missing}} />")
	expect(testInit).toHaveBeenCalled();
});

it("handles missing engine gracefully", function() {
	var wiki = new $tw.Wiki();
	var text = wiki.renderText("text/html", "text/vnd.tiddlywiki", "<$graph $engine=Missing/>\n");
	expect(text).toContain(">'Missing' graphing library not found.</div>");
});

it("handles no engines installed gracefully", function() {
	var utils = require("$:/plugins/flibbles/graph/utils.js");
	spyOn(utils, "getEngineMap").and.returnValue({});
	var wiki = new $tw.Wiki();
	var text = wiki.renderText("text/html", "text/vnd.tiddlywiki", "<$graph/>\n");
	expect(text).toContain(">No graphing libraries installed.</div>");
});

it("handles bad global setting gracefully", function() {
	var wiki = new $tw.Wiki();
	wiki.addTiddler({title: "$:/config/flibbles/graph/engine", text: "Missing"});
	var text = wiki.renderText("text/html", "text/vnd.tiddlywiki", "<$graph/>\n");
	expect(text).toContain(">Graph plugin configured to use missing 'Missing' engine. Fix this in plugin settings.</div>");
});

it("performs complete refresh if engine changes", async function() {
	var testUpdate = spyOn($tw.test.adapter, "update");
	var alsoInit = spyOn($tw.test.adapterAlso, "init");
	var wiki = new $tw.Wiki();
	wiki.addTiddler({title: "target", text: "Test"});
	var widget = $tw.test.renderText(wiki, "<$graph $engine={{target}}><$node $tiddler=A/><$node $tiddler=B/><$edge from=A to=B/>");
	await $tw.test.flushChanges();
	wiki.addTiddler({title: "target", text: "Also"});
	await $tw.test.flushChanges();
	expect(testUpdate).not.toHaveBeenCalled();
	expect(alsoInit).toHaveBeenCalledTimes(1);
	// Let's make sure it didn't hold onto old objects from the old engine.
	var objects = alsoInit.calls.first().args[1];
	expect(objects.nodes).toEqual({A: {}, B: {}});
	expect(Object.values(objects.edges)).toEqual([{from: "A", to: "B"}]);
});

it("handles switching to a bad engine", async function() {
	var testUpdate = spyOn($tw.test.adapter, "update");
	var wiki = new $tw.Wiki();
	wiki.addTiddler({title: "target", text: "Test"});
	var widget = $tw.test.renderText(wiki, "<$graph $engine={{target}} />\n");
	await $tw.test.flushChanges();
	wiki.addTiddler({title: "target", text: "Missing"});
	await $tw.test.flushChanges();
	expect(testUpdate).not.toHaveBeenCalled();
	// There should only be the error widget. No canvas
	expect(widget.parentDomNode.innerHTML).toContain("not found");
	expect(widget.parentDomNode.innerHTML).not.toContain("<canvas");
	// If $graph doesn't properly execute, and holds old data, a crash happens.
});

it("detects change of global engine configuration", async function() {
	var alsoInit = spyOn($tw.test.adapterAlso, "init");
	var testUpdate = spyOn($tw.test.adapter, "update");
	var wiki = new $tw.Wiki();
	wiki.addTiddler({title: "$:/config/flibbles/graph/engine", text: "Test"});
	var widget = $tw.test.renderText(wiki, "<$graph/>\n");
	await $tw.test.flushChanges();
	wiki.addTiddler({title: "$:/config/flibbles/graph/engine", text: "Also"});
	await $tw.test.flushChanges();
	expect(testUpdate).not.toHaveBeenCalled();
	expect(alsoInit).toHaveBeenCalled();
});

it("does not refresh explicit engine if global changes", async function() {
	var wiki = new $tw.Wiki();
	wiki.addTiddler({title: "$:/config/flibbles/graph/engine", text: "Test"});
	var widget = $tw.test.renderText(wiki, "<$graph $engine=Test/>\n");
	await $tw.test.flushChanges();
	var testInit = spyOn($tw.test.adapter, "init");
	wiki.addTiddler({title: "$:/config/flibbles/graph/engine", text: "Also"});
	await $tw.test.flushChanges();
	expect(testInit).not.toHaveBeenCalled();
});

/*** Typesetting ***/

it("converts numbers into numbers before passing them", function() {
	var testInit = spyOn($tw.test.adapter, "init");
	var wiki = new $tw.Wiki();
	var widget = $tw.test.renderText(wiki, "<$graph><$node $tiddler=A label=string size=5/><$node $tiddler=B size=0/><$node $tiddler=C size='-5' />");
	var objects = testInit.calls.first().args[1];
	// B ensures that 0, which is falsy, still passes through fine.
	// C ensures that we respect minimum allowed values.
	expect(objects.nodes).toEqual({A: {label: "string", size: 5}, B: {size: 0}, C: {size: 0}});
});

// TODO: Only edges
// TODO: No edges

});
