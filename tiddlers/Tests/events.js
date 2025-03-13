/*\

Tests that graphs properly refresh.

\*/

describe('Events', function() {

var TestEngine = $tw.modules.applyMethods("graphengine").Test;

var wiki, window;

beforeEach(function() {
	wiki = new $tw.Wiki();
	({window} = $tw.test.setSpies());
});

it('handles double click events to canvas', function() {
	var widgetNode = $tw.test.renderText(wiki, "<$graph><$action-test x y xView yView /><$node $tiddler=test><$action-test bad=node /></$node><$edge from=test to=test><$action-test bad=edge />");
	$tw.test.dispatchEvent(wiki, {type: 'doubleclick'}, {x: 37, y: 43, xView: 101, yView: 103});
	expect($tw.test.actionMethod).toHaveBeenCalledTimes(1);
	expect($tw.test.actionMethod).toHaveBeenCalledWith({x: "37", y: "43", xView: "101", yView: "103"});
});

it("can send custom events to nodes", function() {
	var widget = $tw.test.renderText(wiki, "<$graph><$node $tiddler=A delete='<$action-test targetTiddler/>' />");
	$tw.test.dispatchEvent(wiki, {
		type: "delete",
		id: "A",
		objectType: "nodes"
	});
	expect($tw.test.actionMethod).toHaveBeenCalledTimes(1);
	expect($tw.test.actionMethod).toHaveBeenCalledWith({targetTiddler: "A"});
});

it("can send custom events to properties", function() {
	var widget = $tw.test.renderText(wiki, "<$graph><$properties delete='<$action-test targetTiddler/>' $for=nodes><$node $tiddler=A />");
	$tw.test.dispatchEvent(wiki, {
		type: "delete",
		id: "A",
		objectType: "nodes"
	});
	expect($tw.test.actionMethod).toHaveBeenCalledTimes(1);
	expect($tw.test.actionMethod).toHaveBeenCalledWith({targetTiddler: "A"});
});

it('can send custom graph events to the graph', function() {
	var event = {
		type: "addNode",
		objectType: "graph"};
	var variables = {
		x: 23, y: 27,
		xView: 67, yView: 71};
	var widget = $tw.test.renderText(wiki, "<$graph addNode='<$action-test x y xView yView />'>");
	$tw.test.dispatchEvent(wiki, event, variables);
	expect($tw.test.actionMethod).toHaveBeenCalledTimes(1);
	expect($tw.test.actionMethod).toHaveBeenCalledWith({x: "23",y: "27", xView: "67", yView: "71"});
});

});
