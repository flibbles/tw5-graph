/*\

Tests that graphs properly refresh.

\*/

describe('Events', function() {

var TestEngine = $tw.modules.applyMethods("graphengine").Test;

var wiki, init, update, window;

beforeEach(function() {
	wiki = new $tw.Wiki();
	({init, update, window} = $tw.test.setSpies());
});

it('can send events to $property', function() {
	var event = {objectType: "nodes", id: "target", type: "hover"};
	var variables ={x: 23, y: 27};
	var widget = $tw.test.renderText(wiki, "<$graph><$properties hover='<$action-test targetTiddler x y />'><$node $tiddler=target />");
	$tw.test.dispatchEvent(wiki, event, $tw.utils.extend({}, variables));
	expect($tw.test.actionMethod).toHaveBeenCalledTimes(1);
	expect($tw.test.actionMethod).toHaveBeenCalledWith({targetTiddler: "target", x: "23", y: "27"});
	// Change the event type.
	event.type = "free";
	$tw.test.dispatchEvent(wiki, event, $tw.utils.extend({}, {x: 3, y:7}));
	expect($tw.test.actionMethod).not.toHaveBeenCalled();
});

it('handles double click events to canvas', function() {
	var widgetNode = $tw.test.renderText(wiki, "<$graph doubleclick='<$action-test x y />'><$node $tiddler=test><$action-test bad=node /></$node><$edge $from=test $to=test><$action-test bad=edge />");
	$tw.test.dispatchEvent(wiki, {objectType: "graph", type: 'doubleclick'}, {x: 37, y: 43});
	expect($tw.test.actionMethod).toHaveBeenCalledTimes(1);
	expect($tw.test.actionMethod).toHaveBeenCalledWith({x: "37", y: "43"});
});

it("can send custom events to nodes", function() {
	var widget = $tw.test.renderText(wiki, "<$graph><$node $tiddler=A delete='<$action-test nodeTiddler/>' />");
	$tw.test.dispatchEvent(wiki, {
		type: "delete",
		id: "A",
		objectType: "nodes"
	});
	expect($tw.test.actionMethod).toHaveBeenCalledTimes(1);
	expect($tw.test.actionMethod).toHaveBeenCalledWith({nodeTiddler: "A"});
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
		x: 23, y: 27};
	var widget = $tw.test.renderText(wiki, "<$graph addNode='<$action-test x y />'>");
	$tw.test.dispatchEvent(wiki, event, variables);
	expect($tw.test.actionMethod).toHaveBeenCalledTimes(1);
	expect($tw.test.actionMethod).toHaveBeenCalledWith({x: "23",y: "27"});
});

it('can ignore events for unknown object types', function() {
	var event = {
		type: "weird",
		objectType: "ineffables"};
	var variables = {};
	var widget = $tw.test.renderText(wiki, "<$graph>");
	// We're not using the usual dispatchEvent method here, because the event
	// we're calling is unknown.
	$tw.test.latestEngine.onevent(wiki, event, variables);
	// No test here, just shouldn't throw an exception
});

it("can handle no-argument events like focus", function() {
	var widget = $tw.test.renderText(wiki, '<$graph focus="<$action-test call=this/>"/>');
	var objects = init.calls.first().args[1];
	expect(objects.graph).toEqual({focus: true});
	$tw.test.dispatchEvent(wiki, { type: "focus", objectType: "graph" });
	expect($tw.test.actionMethod.calls.allArgs()).toEqual([ [{call: "this"}] ]);
});

it("can send graph events to all $for=graph", function() {
	var widget = $tw.test.renderText(wiki, `<$vars value=root><$graph addNode='<$action-test call=<<value>> />'>
		<$vars value=this>
			<$properties $for=graph addNode='<$action-test call=<<value>> />'/>
		</$vars>
		<$vars value=that>
			<$properties $for=graph addNode='<$action-test call=<<value>> />'/>
		</$vars>
		<$properties $for=nodes X=whatever>
			<$properties $for=graph addNode='<$action-test call=other />'/>
		</$properties>
		<$properties addNode='<$action-test call=bad />'/>
	`);
	var objects = init.calls.first().args[1];
	expect(objects.graph).toEqual({addNode: true});
	expect(update).not.toHaveBeenCalled();
	$tw.test.dispatchEvent(wiki, {
		type: "addNode",
		objectType: "graph"
	}, {x: 3, y: 5});
	expect($tw.test.actionMethod).toHaveBeenCalledTimes(4);
	expect($tw.test.actionMethod.calls.allArgs()).toEqual([
		[{call: "this"}],
		[{call: "that"}],
		[{call: "other"}],
		[{call: "root"}]]);
});

it("can send property events to all along chain", function() {
	var widget = $tw.test.renderText(wiki, `<$graph>
		<$vars X=outer Y=outer Z=outer>
		<$properties delete='<$action-test call=<<X>> />'>
		<$properties $filter="[!match[A]]" delete='<$action-test call=NO />'>
		<$vars X=inner Y=inner Z=inner>
		<$properties delete='<$action-test call=<<Y>> />'>
		<$vars X=core Y=core Z=core>
				<$node $tiddler=A delete='<$action-test call=<<Z>> />'/>`);
	var objects = init.calls.first().args[1];
	expect(objects.nodes).toEqual({A: {delete: true}});
	$tw.test.dispatchEvent(wiki, {
		type: "delete",
		objectType: "nodes",
		id: "A"});
	expect($tw.test.actionMethod).toHaveBeenCalledTimes(3);
	expect($tw.test.actionMethod.calls.allArgs()).toEqual([
		[{call: "core"}],
		[{call: "inner"}],
		[{call: "outer"}]]);
});

});
