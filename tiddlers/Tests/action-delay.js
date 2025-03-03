/*\

Tests the action-delay widget.

\*/

describe('ActionDelayWidget', function() {

// We won' have more than one test that actually sets ms to something
// positive, because it's time expensive.
it('works with positive ms', async function() {
	var wiki = new $tw.Wiki();
	var widgetNode = $tw.test.renderText(wiki,"<$action-delay $ms=5><$action-test value=success/>");
	var method = spyOn($tw.test, "actionMethod").and.callThrough();
	widgetNode.invokeActions(widgetNode, {});
	expect(method).not.toHaveBeenCalled();
	var then = (new Date()).getTime();
	var attributes = await $tw.test.actionToBeCalled();
	var now = (new Date()).getTime();
	expect(attributes).toEqual({value: "success"});
	expect(method).toHaveBeenCalled();
	expect(now - then).toBeGreaterThanOrEqual(4);
});

it('works with 0 ms, immediate next event cycle', async function() {
	var wiki = new $tw.Wiki();
	var widgetNode = $tw.test.renderText(wiki,"<$action-delay $ms=0><$action-test value=30/>");
	var method = spyOn($tw.test, "actionMethod");
	widgetNode.invokeActions(widgetNode, {});
	expect(method).not.toHaveBeenCalled();
	await $tw.test.flushChanges();
	expect(method).toHaveBeenCalled();
});

it('treats non-number ms as 0', async function() {
	var wiki = new $tw.Wiki();
	var widgetNode = $tw.test.renderText(wiki,"<$action-delay $ms=string><$action-test value=success/>");
	var method = spyOn($tw.test, "actionMethod");
	widgetNode.invokeActions(widgetNode, {});
	expect(method).not.toHaveBeenCalled();
	await $tw.test.flushChanges();
	expect(method).toHaveBeenCalled();
});

});
