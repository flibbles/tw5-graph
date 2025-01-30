/*\

Tests that graphs properly refresh.

\*/

describe('Events', function() {

var TestEngine = $tw.modules.applyMethods("graphengineadapter").Test;

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

fit('handles double click events to canvas', function() {
	var update = spyOn(TestEngine.prototype, "update").and.callThrough();
	var wiki = new $tw.Wiki();
	wiki.addTiddlers([
		{title: "A", tags: "node"}]);
	var widgetNode = renderText(wiki, "<$graph><$action-setfield $tiddler=results x=<<pointX>> y=<<pointY>> /><$node tiddler=test><$action-setfield $tiddler=results bad=node /></$node><$edge from=test to=test><$action-setfield $tiddler=results bad=edge />");
	$tw.test.dispatchGraphEvent(wiki, {point: {x: 37, y: 43}});
	var results = wiki.getTiddler("results");
	expect(results).not.toBeUndefined();
	expect(results.fields.x).toBe("37");
	expect(results.fields.y).toBe("43");
	expect(results.fields.bad).toBeUndefined();
});

});
