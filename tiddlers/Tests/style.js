/*\

Tests the $style widget.

\*/

describe("StyleWidget", function() {

var TestEngine = $tw.modules.applyMethods("graphengineadapter").Test;

it('can hierarchically apply style to all nested', function() {
	var initialize = spyOn(TestEngine.prototype, "initialize").and.callThrough();
	var wiki = new $tw.Wiki();
	var widget = $tw.test.renderText(wiki, "<$graph><$style $for=nodes custom=val dynamic=1><$style $for=nodes dynamic=2><$node tiddler=A label=label/><$node tiddler=B/><$edge from=A to=B/></$style><$node tiddler=C/></$style><$node tiddler=D/>");
	expect(initialize).toHaveBeenCalledTimes(1);
	expect(initialize).toHaveBeenCalledTimes(1);
	var objects = initialize.calls.first().args[1];
	expect(objects.nodes).toEqual({A: {custom: "val", dynamic: "2", label: "label"}, B: {custom: "val", dynamic: "2"}, C: {custom: "val", dynamic: "1"}, D: {}});
	expect(Object.values(objects.edges)).toEqual([{from: "A", to: "B"}]);
});

});
