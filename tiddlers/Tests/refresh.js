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
	expect(update).toHaveBeenCalledWith({nodes: {B: null, B2: {}, C: {label: "Ccaption"}}, edges: {}});
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
	expect(update.calls.first().args[0].nodes).toEqual({});
	expect(Object.values(update.calls.first().args[0].edges)).toEqual([
		{from: "B", to: "A", label: "newLabel"},
		null,
		{from: "D", to: "C"}]);
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
	expect(clean(wiki.latestEngine.objects)).toEqual({nodes: {A:{}}, edges:[]});
	wiki.addTiddler({title: "B", tags: "node"});
	await flushChanges();
	var cleanedArgs = clean(onlyCallOf(update));
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
	expect(clean(wiki.latestEngine.objects)).toEqual({nodes: {A:{}, B:{}}, edges:[{from: "A", to: "B"}]});
	wiki.addTiddler({title: "B"});
	await flushChanges();
	var cleanedArgs = clean(onlyCallOf(update));
	expect(cleanedArgs).toEqual({nodes: {B: null}, edges: [null]});
});

function clean(objects) {
	objects.edges = Object.values(objects.edges);
	return objects;
};

function onlyCallOf(spy) {
	expect(spy).toHaveBeenCalledTimes(1);
	return spy.calls.first().args[0];
};

// Also if an edge gets incompleted later
// Only edges
// No edges

});
