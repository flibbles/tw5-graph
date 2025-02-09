/*\

Tests the $style widget.

\*/

describe("StyleWidget", function() {

var TestEngine = $tw.modules.applyMethods("graphengineadapter").Test;

it('can apply style to all nested', function() {
	var initialize = spyOn(TestEngine.prototype, "initialize").and.callThrough();
	var wiki = new $tw.Wiki();
	var widget = $tw.test.renderText(wiki, "<$graph><$style $for=nodes custom=val><$node tiddler=A/><$node tiddler=B/><$edge from=A to=B/></$style><$node tiddler=C/>");
	expect(initialize).toHaveBeenCalledTimes(1);
	expect(initialize).toHaveBeenCalledTimes(1);
	var objects = initialize.calls.first().args[1];
	expect(objects.nodes).toEqual({A: {custom: "val"}, B: {custom: "val"}, C: {}});
	expect(Object.values(objects.edges)).toEqual([{from: "A", to: "B"}]);
});

});
