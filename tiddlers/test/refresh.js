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
	spyOn(TestEngine.prototype, "modify").and.callThrough();
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
	expect(wiki.latestEngine.nodes).toEqual([
		{id: "A", label: "A"},
		{id: "B", label: "B"},
		{id: "C", label: "C"}]);
	wiki.addTiddler({title: "B2", tags: "node"});
	await flushChanges();
	//widgetNode.refresh({});
	expect(TestEngine.prototype.modify).toHaveBeenCalledTimes(1);
	expect(TestEngine.prototype.modify).toHaveBeenCalledWith([{id: "B2", label: "B2"}], []);
});

});
