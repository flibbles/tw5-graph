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

it('handles addition of node', async function() {
	var modify = spyOn(TestEngine.prototype, "modify").and.callThrough();
	var wiki = new $tw.Wiki();
	wiki.addEventListener("change", function(changes) {
		widgetNode.refreshChildren(changes);
	});
	wiki.addTiddlers([
		{title: "A", tags: "node"},
		{title: "B", tags: "node"},
		{title: "C", tags: "node"},
		{title: "Test", text: "<$graph><$list filter='[tag[node]]'><$node/>"}]);
	var parser = wiki.parseTiddler("Test");
	var widgetNode = wiki.makeWidget(parser);
	var container = $tw.fakeDocument.createElement("div");
	widgetNode.render(container, null);
	await flushChanges();
	expect(wiki.latestEngine.nodes).toEqual({
		A: {label: "A"},
		B: {label: "B"},
		C: {label: "C"}});
	// Now we add and remove a node to the graph
	wiki.addTiddler({title: "B2", tags: "node"});
	wiki.addTiddler({title: "B"});
	await flushChanges();
	expect(modify).toHaveBeenCalledTimes(1);
	expect(modify).toHaveBeenCalledWith({B: null, B2: {label: "B2"}}, {});
});

});
