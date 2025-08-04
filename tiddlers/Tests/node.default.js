/*\

Tests the node.default global widget.

\*/

describe('node.default \\widget', function() {

var wiki, init, update;

beforeEach(async function() {
	wiki = new $tw.Wiki();
	({init, update} = $tw.test.setSpies());
	await $tw.test.setGlobals(wiki);
});

it("properly sets label using title or caption", function() {
	// Testing here that the caption gets treated as wikitext,
	// but the title gets treated as plaintext.
	wiki.addTiddlers([
		{title: "{{Transclude}}"},
		{title: "B", caption: "{{Transclude}}"},
		{title: "Transclude", text: "label"}]);
	var text = "<$graph><$list filter='[[{{Transclude}}]] B'><$node.default />";
	var widget = $tw.test.renderGlobal(wiki, text);
	var keys = Object.keys(init.calls.first().args[1].nodes);
	expect(init.calls.first().args[1].nodes).toEqual({
		"{{Transclude}}": {label: "{{Transclude}}"},
		B: {label: "label"}});
});

it("does not introduce DOM content", function() {
	//Block Mode
	var widget = $tw.test.renderGlobal(wiki, "<$node.default />\n");
	expect(widget.parentDomNode.innerHTML).toBe("", "block mode");
	//Inline Mode
	widget = $tw.test.renderGlobal(wiki, "<$node.default />");
	expect(widget.parentDomNode.innerHTML).toBe("<p></p>", "inline mode");
});

});
