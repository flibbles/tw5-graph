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

it('handles updates to nodes', async function() {
	var modify = spyOn(TestEngine.prototype, "modify").and.callThrough();
	var wiki = new $tw.Wiki();
	wiki.addEventListener("change", function(changes) {
		widgetNode.refreshChildren(changes);
	});
	wiki.addTiddlers([
		{title: "A", tags: "node"},
		{title: "B", tags: "node"},
		{title: "C", tags: "node"},
		{title: "D", tags: "node"},
		{title: "Test", text: "<$graph><$list filter='[tag[node]]'><$node label={{!!caption}} />"}]);
	var parser = wiki.parseTiddler("Test");
	var widgetNode = wiki.makeWidget(parser);
	var container = $tw.fakeDocument.createElement("div");
	widgetNode.render(container, null);
	await flushChanges();
	expect(wiki.latestEngine.nodes).toEqual({ A: {}, B: {}, C: {}, D: {}});
	// Now we add and remove a node to the graph
	wiki.addTiddlers([
		{title: "B2", tags: "node"},
		{title: "B"},
		{title: "C", tags: "node", caption: "Ccaption"}]);
	await flushChanges();
	expect(modify).toHaveBeenCalledTimes(1);
	expect(modify).toHaveBeenCalledWith({B: null, B2: {}, C: {label: "Ccaption"}}, {});
});

});
