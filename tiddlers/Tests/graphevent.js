/*\

Tests the graphevent widget.

\*/

describe('graphEventWidget', function() {

var window, wiki;

beforeEach(function() {
	wiki = new $tw.Wiki();
	({window} = $tw.test.setSpies());
});

it('captures correct events', function() {
	var event = {objectType: "nodes", id: "target", type: "hover"};
	var variables ={x: 23, y: 27, xView: 67, yView: 71};
	var widget = $tw.test.renderText(wiki, "<$graph><$properties hover='<$action-test targetTiddler x y xView yView />'><$node $tiddler=target />");
	$tw.test.dispatchEvent(wiki, event, variables);
	expect($tw.test.actionMethod).toHaveBeenCalledTimes(1);
	expect($tw.test.actionMethod).toHaveBeenCalledWith({targetTiddler: "target", x: "23", y: "27", xView: "67", yView: "71"});
	// Change the event type.
	event.type = "drag";
	$tw.test.dispatchEvent(wiki, event, variables);
	expect($tw.test.actionMethod).not.toHaveBeenCalled();
});

});
