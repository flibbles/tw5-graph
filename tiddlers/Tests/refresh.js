/*\

Tests that graphs properly refresh.

\*/

describe('Refresh', function() {

var TestEngine = $tw.modules.applyMethods("graphengineadapter").Test;

function flushChanges() {
	return new Promise(function(resolve, reject) {
		$tw.utils.nextTick(resolve);
	});
};

function clean(objects) {
	objects.edges = Object.values(objects.edges);
	return objects;
};

function onlyCallOf(spy) {
	expect(spy).toHaveBeenCalledTimes(1);
	return spy.calls.first().args;
};

function renderText(wiki, text) {
	var parser = wiki.parseText("text/vnd.tiddlywiki", text);
	var widgetNode = wiki.makeWidget(parser);
	var container = $tw.fakeDocument.createElement("div");
	wiki.addEventListener("change", function(changes) {
		widgetNode.refreshChildren(changes);
	});
	widgetNode.render(container, null);
	return widgetNode;
};

it('handles updates to nodes', async function() {
	var update = spyOn(TestEngine.prototype, "update").and.callThrough();
	var wiki = new $tw.Wiki();
	wiki.addTiddlers([
		{title: "A", tags: "node"},
		{title: "B", tags: "node"},
		{title: "C", tags: "node"},
		{title: "D", tags: "node"}]);
	var widgetNode = renderText(wiki, "<$graph><$list filter='[tag[node]]'><$node label={{!!caption}} />");
	await flushChanges();
	expect(wiki.latestEngine.objects.nodes).toEqual({ A: {}, B: {}, C: {}, D: {}});
	// Now we add and remove a node to the graph
	wiki.addTiddlers([
		{title: "B2", tags: "node"},
		{title: "B"},
		{title: "C", tags: "node", caption: "Ccaption"}]);
	await flushChanges();
	expect(update).toHaveBeenCalledTimes(1);
	expect(update).toHaveBeenCalledWith({nodes: {B: null, B2: {}, C: {label: "Ccaption"}}});
});

it('handles updates to edges', async function() {
	var update = spyOn(TestEngine.prototype, "update").and.callThrough();
	var wiki = new $tw.Wiki();
	wiki.addTiddlers([
		{title: "A", tags: "node"},
		{title: "B", tags: "node", list: "A"},
		{title: "C", tags: "node"},
		{title: "D", tags: "node", list: "A B"}]);
	var widgetNode = renderText(wiki, "<$graph><$list filter='[tag[node]]'><$node /><$list variable=to filter='[list[]]'><$edge to=<<to>> label={{!!toLabel}} />");
	await flushChanges();
	expect(Object.values(wiki.latestEngine.objects.edges)).toEqual([
		{from: "B", to: "A"}, {from: "D", to: "A"}, {from: "D", to: "B"}]);
	// Now we add and remove a node to the graph
	wiki.addTiddlers([
		{title: "B", tags: "node", list: "A", toLabel: "newLabel"},
		{title: "D", tags: "node", list: "A C"}]);
	await flushChanges();
	expect(update).toHaveBeenCalledTimes(1);
	expect(clean(update.calls.first().args[0])).toEqual({edges: [
		{from: "B", to: "A", label: "newLabel"},
		null,
		{from: "D", to: "C"}]});
	expect(Object.values(wiki.latestEngine.objects.edges)).toEqual([
		{from: "B", to: "A", label: "newLabel"},
		{from: "D", to: "A"},
		null,
		{from: "D", to: "C"}]);
});

it('handles incomplete edges completed later', async function() {
	var update = spyOn(TestEngine.prototype, "update").and.callThrough();
	var wiki = new $tw.Wiki();
	wiki.addTiddlers([
		{title: "A", tags: "node"},
		{title: "B"}]);
	var widgetNode = renderText(wiki, "<$graph><$list filter='[tag[node]]'><$node /></$list><$edge from=A to=B />");
	await flushChanges();
	var objects = wiki.latestEngine.objects;
	expect(objects.nodes).toEqual({A:{}});
	expect(objects.edges).toBeUndefined();
	wiki.addTiddler({title: "B", tags: "node"});
	await flushChanges();
	var cleanedArgs = clean(onlyCallOf(update)[0]);
	expect(cleanedArgs).toEqual({nodes: {B: {}}, edges: [{from: "A", to:"B"}]});
});

it('handles edge getting incompleted later', async function() {
	var update = spyOn(TestEngine.prototype, "update").and.callThrough();
	var wiki = new $tw.Wiki();
	wiki.addTiddlers([
		{title: "A", tags: "node"},
		{title: "B", tags: "node"}]);
	var widgetNode = renderText(wiki, "<$graph><$list filter='[tag[node]]'><$node /></$list><$edge from=A to=B />");
	await flushChanges();
	var objects = clean(wiki.latestEngine.objects);
	expect(objects.nodes).toEqual({A:{}, B:{}});
	expect(objects.edges).toEqual([{from: "A", to: "B"}]);
	wiki.addTiddler({title: "B"});
	await flushChanges();
	var cleanedArgs = clean(onlyCallOf(update)[0]);
	expect(cleanedArgs).toEqual({nodes: {B: null}, edges: [null]});
});

it('does not hand over empty edge lists', function() {
	var initialize = spyOn(TestEngine.prototype, "initialize").and.callThrough();
	var wiki = new $tw.Wiki();
	wiki.addTiddler({title: "A"});
	var widgetNode = renderText(wiki, "<$graph><$node tiddler=A/><$edge from=A to=B />");
	expect(initialize).toHaveBeenCalledTimes(1);
	// Might expect to have an edge object because one was added,
	// and then trimmed. But we should be better than that.
	var objects = initialize.calls.first().args[1];
	expect(objects.nodes).toEqual({A: {}});
	expect(objects.edges).toBeUndefined();
});

it('does not send update if no graph objects changed', async function() {
	var update = spyOn(TestEngine.prototype, "update").and.callThrough();
	var wiki = new $tw.Wiki();
	wiki.addTiddlers([{title: "A"},{title: "Other"}]);
	var widgetNode = renderText(wiki, "<$graph>{{Other}}");
	wiki.addTiddler({title: "Other", text: "New content"});
	await flushChanges();
	expect(update).not.toHaveBeenCalled();
});

it('sends style update if palette changes', async function() {
	var update = spyOn(TestEngine.prototype, "update").and.callThrough();
	var initialize = spyOn(TestEngine.prototype, "initialize").and.callThrough();
	var wiki = new $tw.Wiki();
	wiki.addTiddler({title: "graph-node-background", text: "#ff0000"});
	var widgetNode = renderText(wiki, '\\define colour(name) <$transclude tiddler="$name$">#000000</$transclude>\n<$graph/>')
	await flushChanges();
	var initialObjects = onlyCallOf(initialize)[1];
	expect(Object.keys(initialObjects)).toEqual(["style"]);
	expect(initialObjects.style.nodeBackground).toBe("#ff0000");
	// Now we make a change
	wiki.addTiddler({title: "graph-node-background", text: "#0000ff"});
	await flushChanges();
	var newObjects = onlyCallOf(update)[0];
	expect(Object.keys(newObjects)).toEqual(["style"]);
	expect(newObjects.style.nodeBackground).toBe("#0000ff");
});

it('sends style and node updates together', async function() {
	var update = spyOn(TestEngine.prototype, "update").and.callThrough();
	var initialize = spyOn(TestEngine.prototype, "initialize").and.callThrough();
	var wiki = new $tw.Wiki();
	wiki.addTiddler({title: "graph-node-background", text: "#ff0000"});
	var widgetNode = renderText(wiki, '\\define colour(name) <$transclude tiddler="$name$">#000000</$transclude>\n<$graph><$node tiddler=N label={{graph-node-background}} />')
	await flushChanges();
	var initialObjects = onlyCallOf(initialize)[1];
	expect(Object.keys(initialObjects)).toEqual(["nodes", "style"]);
	expect(initialObjects.style.nodeBackground).toBe("#ff0000");
	// Now we make a change
	wiki.addTiddler({title: "graph-node-background", text: "#0000ff"});
	await flushChanges();
	var newObjects = onlyCallOf(update)[0];
	expect(Object.keys(newObjects)).toEqual(["nodes", "style"]);
	expect(newObjects.style.nodeBackground).toBe("#0000ff");
	expect(newObjects.nodes.N).toEqual({label: "#0000ff"});
});

// Only edges
// No edges

});
