/*\

Tests the graphevent widget.

\*/

describe('graphEventWidget', function() {

it('captures correct events', function() {
	var wiki = new $tw.Wiki();
	var widget = $tw.test.renderText(wiki, "<$graph><$graphevent $hover='<$action-test select=<<targetTiddler>> point=<<point>> />'><$node tiddler=target />");
	$tw.test.dispatchEvent(wiki, {objectType: "nodes", id: "target", type: "hover", point: {x: 23, y: 27}});
	expect($tw.test.actionMethod).toHaveBeenCalledTimes(1);
	expect($tw.test.actionMethod).toHaveBeenCalledWith({select: "target", point: "23 27"});
	$tw.test.dispatchEvent(wiki, {objectType: "nodes", id: "target", type: "drag", point: {x: 23, y: 27}});
	expect($tw.test.actionMethod).not.toHaveBeenCalled();
});

});

