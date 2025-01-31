/*\

Tests that graphs properly refresh.

\*/

describe('Events', function() {

var TestEngine = $tw.modules.applyMethods("graphengineadapter").Test;

it('handles double click events to canvas', function() {
	var update = spyOn(TestEngine.prototype, "update").and.callThrough();
	var wiki = new $tw.Wiki();
	wiki.addTiddlers([
		{title: "A", tags: "node"}]);
	var widgetNode = $tw.test.renderText(wiki, "<$graph><$action-setfield $tiddler=results x=<<pointX>> y=<<pointY>> /><$node tiddler=test><$action-setfield $tiddler=results bad=node /></$node><$edge from=test to=test><$action-setfield $tiddler=results bad=edge />");
	$tw.test.dispatchGraphEvent(wiki, {point: {x: 37, y: 43}});
	var results = wiki.getTiddler("results");
	expect(results).not.toBeUndefined();
	expect(results.fields.x).toBe("37");
	expect(results.fields.y).toBe("43");
	expect(results.fields.bad).toBeUndefined();
});

});
