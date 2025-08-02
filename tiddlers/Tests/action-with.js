/*\

Tests the action-with widget.

\*/

describe('ActionWithWidget', function() {

var wiki;

beforeEach(function() {
	wiki = new $tw.Wiki();
	$tw.test.setSpies();
	var oldCreate = $tw.fakeDocument.createElement;
	spyOn($tw.fakeDocument, "createElement").and.callFake(function(tag) {
		var element = oldCreate(tag);
		$tw.utils.extend(element, $tw.test.mock.EventTarget.prototype);
		return element;
	});
});

it("works", function() {
	var widgetNode = $tw.test.renderText(wiki,"<$graph zoom='<$action-with $offset=test><$action-test X=<<test-posx>> Y=<<test-posy>> />' />\n");
	// This should be the graph element
	var element = widgetNode.parentDomNode.children[0];
	element.dispatchEvent({type: "mousemove", offsetX: 13, offsetY: 17});
	$tw.test.dispatchEvent(wiki, { type: "zoom", objectType: "graph"});
	expect($tw.test.actionMethod).toHaveBeenCalledTimes(1);
	expect($tw.test.actionMethod).toHaveBeenCalledWith({X: "13", Y: "17"});
});

});
