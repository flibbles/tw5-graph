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
	var widgetNode = $tw.test.renderText(wiki, "<$graph><$action-test point viewPoint /><$node $tiddler=test><$action-test bad=node /></$node><$edge from=test to=test><$action-test bad=edge />");
	$tw.test.dispatchEvent(wiki, {type: 'doubleclick', point: {x: 37, y: 43}, viewPoint: {x: 101, y: 103}});
	expect($tw.test.actionMethod).toHaveBeenCalledTimes(1);
	expect($tw.test.actionMethod).toHaveBeenCalledWith({point: "37,43", viewPoint: "101,103"});
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
		objectType: "graph",
		point: {x: 23, y: 27},
		viewPoint: {x: 67, y: 71}};
	var widget = $tw.test.renderText(wiki, "<$graph addNode='<$action-test point viewPoint/>'>");
	$tw.test.dispatchEvent(wiki, event);
	expect($tw.test.actionMethod).toHaveBeenCalledTimes(1);
	expect($tw.test.actionMethod).toHaveBeenCalledWith({point: "23,27", viewPoint: "67,71"});
});

});
