/*\

Tests the boolean property type.

\*/

describe("Boolean Property", function() {

var wiki, init, update, window;

beforeEach(async function() {
	wiki = new $tw.Wiki();
	({init, update, window} = $tw.test.setSpies());
	await $tw.test.setGlobals(wiki);
});

it("allows enums with spaces", function() {
	var widget = $tw.test.renderText(wiki, `<$graph>
		<$node $tiddler=yes physics=yes />
		<$node $tiddler=no physics=no />
		<$node $tiddler=words physics=words />
		<$node $tiddler=space physics=' ' />
	`);
	var objects = init.calls.first().args[1];
	expect(objects.nodes).toEqual({
		yes: {physics: true},
		no: {physics: false},
		// Words mean an enum probably tried to set SOMETHING. We'll consider it true.
		words: {physics: true},
		// A space like this is the multi-enum of saying "nothing". We want it to equate to false.
		space: {physics: false},
	});
});


});
