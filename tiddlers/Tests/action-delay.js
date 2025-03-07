/*\

Tests the action-delay widget.

\*/

describe('ActionDelayWidget', function() {

// We won' have more than one test that actually sets ms to something
// positive, because it's time expensive.
it('works with positive ms and clears state', async function() {
	var wiki = new $tw.Wiki();
	var widgetNode = $tw.test.renderText(wiki,"<$action-delay $state=state $ms=10><$action-test value=success/>");
	var method = spyOn($tw.test, "actionMethod").and.callThrough();
	widgetNode.invokeActions(widgetNode, {});
	expect(method).not.toHaveBeenCalled();
	expect(wiki.getTiddler("state")).not.toBeUndefined();
	var then = (new Date()).getTime();
	var attributes = await $tw.test.actionToBeCalled();
	var now = (new Date()).getTime();
	expect(attributes).toEqual({value: "success"});
	expect(method).toHaveBeenCalled();
	expect(now - then).toBeGreaterThanOrEqual(5);
	expect(wiki.getTiddler("state")).toBeUndefined();
});

it('works with 0 ms, immediate next event cycle', async function() {
	var wiki = new $tw.Wiki();
	var widgetNode = $tw.test.renderText(wiki,"<$action-delay $ms=0><$action-test value=success/>");
	var method = spyOn($tw.test, "actionMethod");
	widgetNode.invokeActions(widgetNode, {});
	expect(method).not.toHaveBeenCalled();
	await $tw.test.flushChanges();
	expect(method).toHaveBeenCalledWith({value: "success"});
});

it('treats non-number ms as 0', async function() {
	var wiki = new $tw.Wiki();
	var widgetNode = $tw.test.renderText(wiki,"<$action-delay $ms=string><$action-test />");
	var method = spyOn($tw.test, "actionMethod");
	widgetNode.invokeActions(widgetNode, {});
	expect(method).not.toHaveBeenCalled();
	await $tw.test.flushChanges();
	expect(method).toHaveBeenCalled();
});

it('can be interrupted be deleting the state tiddler', async function() {
	var wiki = new $tw.Wiki();
	var widgetNode = $tw.test.renderText(wiki,"<$action-delay $state=state $ms=0><$action-test />");
	var method = spyOn($tw.test, "actionMethod");
	widgetNode.invokeActions(widgetNode, {});
	wiki.deleteTiddler("state");
	await $tw.test.flushChanges();
	expect(method).not.toHaveBeenCalled();
});

it('gets reset if interrupted and restarted', async function() {
	var wiki = new $tw.Wiki();
	var widgetNode1 = $tw.test.renderText(wiki,"<$action-delay $state=state $ms=0><$action-test value=1 />");
	var widgetNode2 = $tw.test.renderText(wiki,"<$action-delay $state=state $ms=0><$action-test value=2 />");
	var method = spyOn($tw.test, "actionMethod");
	widgetNode1.invokeActions(widgetNode1, {});
	wiki.deleteTiddler("state");
	widgetNode2.invokeActions(widgetNode2, {});
	expect(wiki.getTiddler("state")).not.toBeUndefined();
	await $tw.test.flushChanges();
	expect(method).toHaveBeenCalledTimes(1);
	expect(method).toHaveBeenCalledWith({value: "2"});
	expect(wiki.getTiddler("state")).toBeUndefined();
});

});
