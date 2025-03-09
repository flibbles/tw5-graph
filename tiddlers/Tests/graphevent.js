/*\

Tests the graphevent widget.

\*/

describe('graphEventWidget', function() {

var window;

beforeEach(function() {
	({window} = $tw.test.setSpies());
});

it('captures correct events', function() {
	var wiki = new $tw.Wiki();
	var event = {objectType: "nodes", id: "target", type: "hover", point: {x: 23, y: 27}, viewPoint: {x: 67, y: 71}};
	var widget = $tw.test.renderText(wiki, "<$graph><$style hover='<$action-test targetTiddler point viewPoint />'><$node $tiddler=target />");
	$tw.test.dispatchEvent(wiki, event);
	expect($tw.test.actionMethod).toHaveBeenCalledTimes(1);
	expect($tw.test.actionMethod).toHaveBeenCalledWith({targetTiddler: "target", point: "23,27", viewPoint: "67,71"});
	// Change the event type.
	event.type = "drag";
	$tw.test.dispatchEvent(wiki, event);
	expect($tw.test.actionMethod).not.toHaveBeenCalled();
});

});
