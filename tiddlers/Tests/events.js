/*\

Tests that graphs properly refresh.

\*/

describe('Events', function() {

var TestEngine = $tw.modules.applyMethods("graphengineadapter").Test;

it('handles double click events to canvas', function() {
	var wiki = new $tw.Wiki();
	var widgetNode = $tw.test.renderText(wiki, "<$graph><$action-test point=<<point>> /><$node tiddler=test><$action-test bad=node /></$node><$edge from=test to=test><$action-test bad=edge />");
	$tw.test.dispatchEvent(wiki, {type: 'doubleclick', point: {x: 37, y: 43}});
	expect($tw.test.actionMethod).toHaveBeenCalledTimes(1);
	expect($tw.test.actionMethod).toHaveBeenCalledWith({point: "37 43"});
});

});
