/*\

Tests the enum property type.

\*/

describe("Enum Property", function() {

var wiki, init, update, window;

beforeEach(function() {
	wiki = new $tw.Wiki();
	({init, update, window} = $tw.test.setSpies());
});

it("ignores non-existent options", function() {
	var widget = $tw.test.renderText(wiki, "<$graph><$node $tiddler=A shape=nonexistent />");
	var objects = init.calls.first().args[1];
	expect(objects.nodes).toEqual({A: {}});
});

});
