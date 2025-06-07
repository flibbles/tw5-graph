/*\

Tests the image property type.

\*/

describe("Image Property", function() {

var wiki, init, update, window;

beforeEach(function() {
	wiki = new $tw.Wiki();
	({init, update, window} = $tw.test.setSpies());
});

fit("can handle a raw svg", function() {
	var svg = '<svg xmlns="http://www.w3.org/2000/svg" width="22px" height="22px" viewBox="0 0 128 128" version="1.1"><circle cx="64" cy="64" r="64" /></svg>';
	wiki.addTiddler({title: "Image", type: "image/svg+xml", text: svg});
	var parser = wiki.parseText("image/svg+xml", svg);
	var url = parser.tree[0].attributes.src.value;
	var widget = $tw.test.renderText(wiki, "<$graph><$node $tiddler=A image=Image/>");
	var objects = init.calls.first().args[1];
	expect(objects.nodes).toEqual({A: {image: url}});
});

});
