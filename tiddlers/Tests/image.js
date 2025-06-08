/*\

Tests the image property type.

\*/

describe("Image Property", function() {

var wiki, init, update, window;

beforeEach(function() {
	wiki = new $tw.Wiki();
	({init, update, window} = $tw.test.setSpies());
});

it("can handle a raw svg", function() {
	var svg = '<svg xmlns="http://www.w3.org/2000/svg" width="22px" height="22px" viewBox="0 0 128 128" version="1.1">\n\t<circle cx="64" cy="64" r="64" />\n</svg>';
	wiki.addTiddler({title: "Image", type: "image/svg+xml", text: svg});
	var parser = wiki.parseText("image/svg+xml", svg);
	var url = parser.tree[0].attributes.src.value;
	url = url.replace("svg+xml,", "svg+xml;utf8,");
	var widget = $tw.test.renderText(wiki, "<$graph><$node $tiddler=A image=Image/>");
	var objects = init.calls.first().args[1];
	expect(objects.nodes).toEqual({A: {image: url}});
});

it("can handle wikitext svg with xmlns", function() {
	// It doesn't have the xmlns declaration, because wikitext wouldn't need it.
	var svg = '\\parameters (size:22pt)\n<svg width=<<size>> height=<<size>> viewBox="0 0 128 128" xmlns="http://www.w3.org/2000/svg"><circle cx=64 cy=64 r=64 />';
	var compiled = '<svg height="22pt" viewBox="0 0 128 128" width="22pt" xmlns="http://www.w3.org/2000/svg"><circle cx="64" cy="64" r="64"></circle></svg>';
	var expected = "data:image/svg+xml," + encodeURIComponent(compiled);
	wiki.addTiddler({title: "Image", text: svg});
	var widget = $tw.test.renderText(wiki, "<$graph><$node $tiddler=A image=Image/>");
	var objects = init.calls.first().args[1];
	expect(objects.nodes).toEqual({A: {image: expected}});
});

it("can handle wikitext svg without xmlns", function() {
	// It doesn't have the xmlns declaration, because wikitext wouldn't need it.
	var svg = '\\parameters (size:22pt)\n<svg width=<<size>> height=<<size>> viewBox="0 0 128 128"><circle cx=64 cy=64 r=64 />';
	var compiled = '<svg xmlns="http://www.w3.org/2000/svg" height="22pt" viewBox="0 0 128 128" width="22pt"><circle cx="64" cy="64" r="64"></circle></svg>';
	var expected = "data:image/svg+xml," + encodeURIComponent(compiled);
	wiki.addTiddler({title: "Image", text: svg});
	var widget = $tw.test.renderText(wiki, "<$graph><$node $tiddler=A image=Image/>");
	var objects = init.calls.first().args[1];
	expect(objects.nodes).toEqual({A: {image: expected}});
});

it("can handle actual URIs", function() {
	var url = "https://testdomain.com/image.jpg";
	var widget = $tw.test.renderText(wiki, `<$graph><$node $tiddler=A image="${url}"/>`);
	var objects = init.calls.first().args[1];
	expect(objects.nodes).toEqual({A: {image: url}});
});

it("can handle canonical URIs", function() {
	var url = "https://testdomain.com/image.jpg";
	wiki.addTiddler({title: "Image", _canonical_uri: url, type: "image/jpeg", text: ""});
	var widget = $tw.test.renderText(wiki, "<$graph><$node $tiddler=A image=Image/>");
	var objects = init.calls.first().args[1];
	expect(objects.nodes).toEqual({A: {image: url}});
});

});
