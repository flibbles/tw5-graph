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
	var spies = $tw.test.spyOnAdapter("Also");
	spies.testRules("nodes", { img: {type: "image"} });
	var svg = `<?xml version="1.0" encoding="UTF-8" standalone="no"?>
<!DOCTYPE svg PUBLIC "-//W3C//DTD SVG 1.1//EN" "http://www.w3.org/Graphics/SVG/1.1/DTD/svg11.dtd">

<!-- This is a comment which shouldn't mess up anything -->

<svg xmlns="http://www.w3.org/2000/svg" version="1.1" width="22px" height="22px" viewBox="0 0 128 128">
	<circle cx="64" cy="64" r="64" /><!-- Inline comment -->
</svg>`;
	var compiled = '<svg height="22px" version="1.1" viewBox="0 0 128 128" width="22px" xmlns="http://www.w3.org/2000/svg">\n\t<circle cx="64" cy="64" r="64"></circle>\n</svg>';
	var expected = "data:image/svg+xml;utf8," + encodeURIComponent(compiled);
	wiki.addTiddler({title: "Image", type: "image/svg+xml", text: svg});
	var widget = $tw.test.renderText(wiki, "<$graph $engine=Also><$node $tiddler=A img=Image/>");
	var objects = spies.init.calls.first().args[1];
	expect(objects.nodes).toEqual({A: {img: expected}});
});

it("can handle wikitext svg with xmlns", function() {
	var spies = $tw.test.spyOnAdapter("Also");
	spies.testRules("nodes", { img: {type: "image"} });
	// It doesn't have the xmlns declaration, because wikitext wouldn't need it.
	var svg = '\\parameters (size:22pt)\n<svg width=<<size>> height=<<size>> viewBox="0 0 128 128" xmlns="http://www.w3.org/2000/svg"><circle cx=64 cy=64 r=64 />';
	var compiled = '<svg height="22pt" viewBox="0 0 128 128" width="22pt" xmlns="http://www.w3.org/2000/svg"><circle cx="64" cy="64" r="64"></circle></svg>';
	var expected = "data:image/svg+xml," + encodeURIComponent(compiled);
	wiki.addTiddler({title: "Image", text: svg});
	var widget = $tw.test.renderText(wiki, "<$graph $engine=Also><$node $tiddler=A img=Image/>");
	var objects = spies.init.calls.first().args[1];
	expect(objects.nodes).toEqual({A: {img: expected}});
});

it("can handle wikitext svg without xmlns", function() {
	var spies = $tw.test.spyOnAdapter("Also");
	spies.testRules("nodes", { img: {type: "image"} });
	// It doesn't have the xmlns declaration, because wikitext wouldn't need it.
	var svg = '\\parameters (size:22pt)\n<svg width=<<size>> height=<<size>> viewBox="0 0 128 128"><circle cx=64 cy=64 r=64 />';
	var compiled = '<svg height="22pt" viewBox="0 0 128 128" width="22pt" xmlns="http://www.w3.org/2000/svg"><circle cx="64" cy="64" r="64"></circle></svg>';
	var expected = "data:image/svg+xml," + encodeURIComponent(compiled);
	wiki.addTiddler({title: "Image", text: svg});
	var widget = $tw.test.renderText(wiki, "<$graph $engine=Also><$node $tiddler=A img=Image/>");
	var objects = spies.init.calls.first().args[1];
	expect(objects.nodes).toEqual({A: {img: expected}});
});

it("can handle wikitext svg that only indirectly contains <svg", function() {
	var spies = $tw.test.spyOnAdapter("Also");
	spies.testRules("nodes", { img: {type: "image"} });
	// It doesn't have the svg directly
	wiki.addTiddler({title: "Source", text: "<svg><text>TextBody"});
	wiki.addTiddler({title: "Image", text: "{{Source}}"});
	var widget = $tw.test.renderText(wiki, "<$graph $engine=Also><$node $tiddler=A img=Image/>");
	var objects = spies.init.calls.first().args[1];
	expect(objects.nodes.A.img).toContain("svg+xml");
	expect(objects.nodes.A.img).toContain("TextBody");
});

it("handles wikitext that uses macros", function() {
	var spies = $tw.test.spyOnAdapter("Also");
	spies.testRules("nodes", { img: {type: "image"} });
	// It doesn't have the svg directly
	wiki.addTiddler({title: "Image", text: "<svg><text><<local>>"});
	var widget = $tw.test.renderText(wiki, "\\procedure local() LocalBody\n<$graph $engine=Also><$node $tiddler=A img=Image/>");
	var objects = spies.init.calls.first().args[1];
	expect(objects.nodes.A.img).toContain("LocalBody");
});

it("handles wikitext that uses internally nested variables", function() {
	var spies = $tw.test.spyOnAdapter("Also");
	spies.testRules("nodes", { img: {type: "image"} });
	// It doesn't have the svg directly
	wiki.addTiddler({title: "Image", text: "<svg><text><<local>>"});
	var widget = $tw.test.renderText(wiki, "\\procedure local() DONOTUSE\n<$graph $engine=Also><$let local=LocalBody><$node $tiddler=A img=Image/>");
	var objects = spies.init.calls.first().args[1];
	expect(objects.nodes.A.img).toContain("LocalBody");
	// The outer definition of "local" should not be used
	expect(objects.nodes.A.img).not.toContain("DONOTUSE");
});

it("can handle base64 encoded images", function() {
	var jpgBody = $tw.utils.base64Encode("This isn't actually a jpg body...");
	var expected = "data:image/jpeg;base64," + jpgBody;
	wiki.addTiddler({title: "Image.jpg", type: "image/jpeg", text: jpgBody});
	var widget = $tw.test.renderText(wiki, "<$graph><$node $tiddler=A image='Image.jpg'/>");
	var objects = init.calls.first().args[1];
	expect(objects.nodes).toEqual({A: {image: expected}});
});

it("can use shadow tiddlers", function() {
	var pluginTitle = "$:/flibbles/test";
	var pluginBody = '{"tiddlers": {"$:/flibbles/test/image": {"text": "<svg><text>inside-plugin"}}}';
	wiki.addTiddler({title: pluginTitle, "plugin-type": "plugin", type: "application/json", text: pluginBody});
	wiki.registerPluginTiddlers("plugin", [pluginTitle]);
	wiki.readPluginInfo([pluginTitle]);
	wiki.unpackPluginTiddlers("plugin", [pluginTitle]);
	var widget = $tw.test.renderText(wiki, "<$graph><$node $tiddler=A image='$:/flibbles/test/image' />");
	var objects = init.calls.first().args[1];
	expect(objects.nodes.A.image).toContain("inside-plugin");
});

it("caches wikitext svg", function() {
	var spies = $tw.test.spyOnAdapter("Also");
	spies.testRules("nodes", { img: {type: "image"} });
	// It doesn't have the xmlns declaration, because wikitext wouldn't need it.
	var svg = '<svg viewBox="0 0 128 128"><circle cx=64 cy=64 r=64 />';
	wiki.addTiddler({title: "Image", text: svg});
	var render = spyOn(wiki, "parseTiddler").and.callThrough();
	var widget = $tw.test.renderText(wiki, "<$graph $engine=Also><$node $tiddler=A img=Image/><$node $tiddler=B img=Image/>");
	var objects = spies.init.calls.first().args[1];
	expect(objects.nodes.A.img).toContain("svg+xml");
	expect(render).toHaveBeenCalledTimes(1);
});

it("detects changes in wikitext svg", async function() {
	// It doesn't have the xmlns declaration, because wikitext wouldn't need it.
	wiki.addTiddler({title: "ImageA", text: "<svg><text>A-text"});
	wiki.addTiddler({title: "ImageB", text: "<svg><text>B-text"});
	await $tw.test.flushChanges();
	var widget = $tw.test.renderText(wiki, "<$graph><$node $tiddler=A image=ImageA /><$node $tiddler=B image=ImageB />");
	var objects = init.calls.first().args[1];
	expect(objects.nodes.A.image).toContain("svg+xml");
	expect(objects.nodes.A.image).toContain("A-text");
	expect(objects.nodes.B.image).toContain("svg+xml");
	expect(objects.nodes.B.image).toContain("B-text");
	var parse = spyOn(wiki, "parseTiddler").and.callThrough();
	// Now we change it remotely
	wiki.addTiddler({title: "ImageA", text: "<svg><text>A-alternate"});
	await $tw.test.flushChanges();
	expect(update).toHaveBeenCalled();
	var nodes = update.calls.first().args[0].nodes;
	expect(nodes.A.image).toContain("svg+xml");
	expect(nodes.A.image).toContain("A-alternate");
	// B is unrelated and should not have changed
	expect(nodes.B).toBeUndefined();
	expect(parse).toHaveBeenCalledTimes(1);
});

it("detects changes in $properties attributes", async function() {
	// It doesn't have the xmlns declaration, because wikitext wouldn't need it.
	wiki.addTiddler({title: "Image", text: "<svg><text>FirstContent"});
	await $tw.test.flushChanges();
	var widget = $tw.test.renderText(wiki, "<$graph><$properties image=Image><$node $tiddler=A />");
	var objects = init.calls.first().args[1];
	expect(objects.nodes.A.image).toContain("svg+xml");
	expect(objects.nodes.A.image).toContain("FirstContent");
	// Now we change it remotely
	wiki.addTiddler({title: "Image", text: "<svg><text>SecondContent"});
	await $tw.test.flushChanges();
	expect(update).toHaveBeenCalled();
	var nodes = update.calls.first().args[0].nodes;
	expect(nodes.A.image).toContain("svg+xml");
	expect(nodes.A.image).toContain("SecondContent");
});

it("detects changes in $properties dataTiddler", async function() {
	// It doesn't have the xmlns declaration, because wikitext wouldn't need it.
	wiki.addTiddler({title: "Image", text: "<svg><text>FirstContent"});
	wiki.addTiddler({title: "Data", text: '{"image": "Image"}', type: "application/json"});
	await $tw.test.flushChanges();
	var widget = $tw.test.renderText(wiki, "<$graph><$properties $tiddler=Data><$node $tiddler=A />");
	var objects = init.calls.first().args[1];
	expect(objects.nodes.A.image).toContain("svg+xml");
	expect(objects.nodes.A.image).toContain("FirstContent");
	// Now we change it remotely
	wiki.addTiddler({title: "Image", text: "<svg><text>SecondContent"});
	await $tw.test.flushChanges();
	expect(update).toHaveBeenCalled();
	var nodes = update.calls.first().args[0].nodes;
	expect(nodes.A.image).toContain("svg+xml");
	expect(nodes.A.image).toContain("SecondContent");
});

it("detects indirect changes in wikitext svg", async function() {
	// It doesn't have the xmlns declaration, because wikitext wouldn't need it.
	var svg = '<svg><text><$text text={{Text}} />';
	wiki.addTiddler({title: "Text", text: "A-original"});
	wiki.addTiddler({title: "Image", text: svg});
	await $tw.test.flushChanges();
	var render = spyOn(wiki, "parseTiddler").and.callThrough();
	var widget = $tw.test.renderText(wiki, "<$graph><$node $tiddler=A image=Image/>");
	var objects = init.calls.first().args[1];
	expect(objects.nodes.A.image).toContain("svg+xml");
	expect(objects.nodes.A.image).toContain("A-original");
	expect(render).toHaveBeenCalledTimes(1);
	render.calls.reset();
	// Now we change it remotely
	wiki.addTiddler({title: "Text", text: "A-changed"});
	await $tw.test.flushChanges();
	expect(render).not.toHaveBeenCalled();
	var newUri = update.calls.first().args[0].nodes.A.image;
	expect(newUri).toContain("svg+xml");
	expect(newUri).toContain("A-changed");
});

// We're good about preserving the parse tree, but do we need the
// internal transclude widget to render over and over?
// Yes. Yes we do.
it("caches wikitext svg without need for repeated rendering", function() {
	var spies = $tw.test.spyOnAdapter("Also");
	// For this test, we will use a custom property with no color properties
	// We'll test for those separately.
	spies.testRules("nodes", {
		img: {type: "image"}
	});
	wiki.addTiddler({title: "Source", text: 'Content'});
	// We have a transclusion in here, because it's easy to detect rendering
	// that has a transclusion in it by watching wiki.renderTiddler
	wiki.addTiddler({title: "Image", text: '<svg><text>{{Source}}'});
	var oldParse = wiki.parseTiddler;
	var render = spyOn(wiki, "parseTiddler").and.callFake(function() {
		return oldParse.apply(this, arguments);
	});//callThrough();
	var widget = $tw.test.renderText(wiki, `<$graph $engine=Also>
	  <$node $tiddler=A img=Image/>
	  <$node $tiddler=B img=Image/>
	  <$node $tiddler=C img=Image/>
	  <$node $tiddler=D img=Image/>`);
	var objects = spies.init.calls.first().args[1];
	expect(objects.nodes.A.img).toContain("svg+xml");
	expect(objects.nodes.A.img).toContain("Content");
	// Once by the image, four times for the transclusion in the image
	expect(render).toHaveBeenCalledTimes(5);
});

it("ignores non svg wikitext tiddlers", function() {
	var text = "Text content";
	wiki.addTiddler({title: "Image", text: text});
	var widget = $tw.test.renderText(wiki, "<$graph><$node $tiddler=A image=Image/>");
	var objects = init.calls.first().args[1];
	expect(objects.nodes).toEqual({A: {}});
});

it("can handle actual URIs", function() {
	var url = "https://testdomain.com/image.jpg";
	var widget = $tw.test.renderText(wiki, `<$graph><$node $tiddler=A image="${url}"/>`);
	var objects = init.calls.first().args[1];
	expect(objects.nodes).toEqual({A: {image: url}});
});

// We make sure of this, or else it's effectively a memory leak--creating
// caches for all sorts of non-existent tiddlers that will never clear.
it("caches nothing with URIs", async function() {
	wiki.addTiddler({title: "Image", text: "<svg><text>Local"});
	await $tw.test.flushChanges();
	var widget = $tw.test.renderText(wiki, `<$graph>
	  <$node $tiddler=A image=Image/>
	  <$node $tiddler=B image=Remote/>`);
	var nodes = init.calls.first().args[1].nodes;
	expect(nodes.A.image).toContain("Local");
	expect(nodes.B.image).toBe("Remote");
	expect(wiki.caches.Image).not.toBeUndefined();
	expect(wiki.caches.Remote).toBeUndefined();
});

it("can handle canonical URIs", function() {
	var url = "https://testdomain.com/image.jpg";
	wiki.addTiddler({title: "Image", _canonical_uri: url, type: "image/jpeg", text: ""});
	var widget = $tw.test.renderText(wiki, "<$graph><$node $tiddler=A image=Image/>");
	var objects = init.calls.first().args[1];
	expect(objects.nodes).toEqual({A: {image: url}});
});

// it("Can handle canonical uris that have text.")
// But how? Not even TW is consistent about this.

/*** Colors ***/

it("can inject colors into wiki images", async function() {
	// It doesn't have the xmlns declaration, because wikitext wouldn't need it.
	var svg = '<svg viewBox="0 0 128 128">\n\n<circle/>\n';
	var expected = encodeURIComponent("<style>:root{fill:#00ff00;}</style><circle");
	wiki.addTiddler({title: "graph-node-color", text: "#00ff00"});
	wiki.addTiddler({title: "Image", text: svg});
	await $tw.test.flushChanges();
	var widget = $tw.test.renderText(wiki, "\\procedure colour(name) <$transclude $tiddler=<<name>> />\n<$graph><$node $tiddler=A image=Image/>");
	var objects = init.calls.first().args[1];
	expect(objects.nodes.A.image).toContain(expected);
	wiki.addTiddler({title: "graph-node-color", text: "#0000ff"});
	await $tw.test.flushChanges();
	objects = update.calls.first().args[0];
	expect(objects.nodes.A.image).toContain(encodeURIComponent("fill:#0000ff"));
});

it("can inject colors into xml images", async function() {
	// It doesn't have the xmlns declaration, because wikitext wouldn't need it.
	var svg = '<svg xmlns="http://www.w3.org/2000/svg" width="22px" height="22px" viewBox="0 0 128 128" version="1.1">\n\t<circle cx="64" cy="64" r="64" />\n</svg>';
	var expected = encodeURIComponent('<svg height="22px" version="1.1" viewBox="0 0 128 128" width="22px" xmlns="http://www.w3.org/2000/svg"><style>:root{fill:#00ff00;}</style>\n\t<circle');
	wiki.addTiddler({title: "graph-node-color", text: "#00ff00"});
	wiki.addTiddler({title: "Image", type: "image/svg+xml", text: svg});
	await $tw.test.flushChanges();
	var widget = $tw.test.renderText(wiki, "\\procedure colour(name) <$transclude $tiddler=<<name>> />\n<$graph><$node $tiddler=A image=Image/>");
	var objects = init.calls.first().args[1];
	expect(objects.nodes.A.image).toContain(expected);
	wiki.addTiddler({title: "graph-node-color", text: "#0000ff"});
	await $tw.test.flushChanges();
	objects = update.calls.first().args[0];
	expect(objects.nodes.A.image).toContain(encodeURIComponent("fill:#0000ff"));
});

it("does not inject colors if none describe in rule", function() {
	// It doesn't have the xmlns declaration, because wikitext wouldn't need it.
	var AlsoSpies = $tw.test.spyOnAdapter("Also");
	AlsoSpies.testRules("nodes", {
		img: {type: "image"}
	});
	var svg = '<svg viewBox="0 0 128 128">\n\n<circle/>\n';
	wiki.addTiddler({title: "graph-node-color", text: "#00bfab"});
	wiki.addTiddler({title: "Image", text: svg});
	var widget = $tw.test.renderText(wiki, "\\procedure colour(name) <$transclude $tiddler=<<name>> />\n<$graph $engine=Also><$node $tiddler=A img=Image/>");
	var objects = AlsoSpies.init.calls.first().args[1];
	expect(objects.nodes.A.img).toContain("circle");
	// The node color does not show up anywhere
	expect(objects.nodes.A.img).not.toContain("style");
});

it("does not inject color into non-xml, nor refresh", async function() {
	var spies = $tw.test.spyOnAdapter("Also");
	spies.testRules("nodes", {
		img: {type: "image", style: {fill: "color"}},
		color: {type: "color", default: "graph-node-color"}
	});
	var jpgBody = $tw.utils.base64Encode("This isn't actually a jpg body...");
	var expected = "data:image/jpeg;base64," + jpgBody;
	wiki.addTiddler({title: "graph-node-color", text: "#00ff00"});
	wiki.addTiddler({title: "Image.jpg", type: "image/jpeg", text: jpgBody});
	wiki.addTiddler({title: "Image.svg", text: '<svg><circle/>'});
	var text = `\\procedure colour(name) <$transclude $tiddler=<<name>> />
		<$graph $engine=Also>
			<$node $tiddler=jpg img=Image.jpg />
			<$node $tiddler=svg img=Image.svg />`
	await $tw.test.flushChanges();
	var widget = $tw.test.renderText(wiki, text);
	var objects = spies.init.calls.first().args[1];
	expect(objects.nodes.svg.img).toContain("00ff00");
	expect(objects.nodes.jpg.img).toContain(jpgBody);
	wiki.addTiddler({title: "graph-node-color", text: "#112233"});
	await $tw.test.flushChanges();
	objects = spies.update.calls.first().args[0];
	expect(objects.nodes.svg.img).toContain("112233");
	expect(objects.nodes.jpg).toBeUndefined();
});

it("can take color from colors assigned to same object", async function() {
	// It doesn't have the xmlns declaration, because wikitext wouldn't need it.
	var svg = '<svg viewBox="0 0 128 128"><circle/>';
	var expected = encodeURIComponent("<style>:root{fill:#030303;}</style><circle");
	wiki.addTiddler({title: "Image", text: svg});
	await $tw.test.flushChanges();
	var widget = $tw.test.renderText(wiki, "<$graph><$node $tiddler=A image=Image color=#030303 />");
	var objects = init.calls.first().args[1];
	expect(objects.nodes.A.image).toContain(expected);
	wiki.addTiddler({title: "graph-node-color", text: "#0000ff"});
	await $tw.test.flushChanges();
	expect(update).not.toHaveBeenCalled();
	// TODO: Test when the color literally is changed maybe?
});

it("can specify color properties that aren't set", function() {
	// It doesn't have the xmlns declaration, because wikitext wouldn't need it.
	var AlsoSpies = $tw.test.spyOnAdapter("Also");
	AlsoSpies.testRules("nodes", {
		img: {type: "image", style: {fill: "color"}},
		color: {type: "color"}
	});
	wiki.addTiddler({title: "Image", text: '<svg><circle/>'});
	var widget = $tw.test.renderText(wiki, "<$graph $engine=Also><$node $tiddler=A img=Image/><$node $tiddler=B img=Image color=#00ff00 />");
	var objects = AlsoSpies.init.calls.first().args[1];
	expect(objects.nodes.A.img).toContain("circle");
	// The node color does not show up anywhere
	expect(objects.nodes.A.img).not.toContain("style");
	// B should have a style though
	expect(objects.nodes.B.img).toContain("00ff00");
});

it("can specify color properties that aren't defined", function() {
	// It doesn't have the xmlns declaration, because wikitext wouldn't need it.
	var AlsoSpies = $tw.test.spyOnAdapter("Also");
	AlsoSpies.testRules("nodes", {
		img: {type: "image", style: {fill: "color"}}
	});
	wiki.addTiddler({title: "Image", text: '<svg><circle/>'});
	var widget = $tw.test.renderText(wiki, "<$graph $engine=Also><$node $tiddler=A img=Image/><$node $tiddler=B img=Image color=passedAsIs />");
	var objects = AlsoSpies.init.calls.first().args[1];
	expect(objects.nodes.A.img).toContain("circle");
	// The node color does not show up anywhere
	expect(objects.nodes.A.img).not.toContain("style");
	// B should have a style though
	expect(objects.nodes.B.img).toContain("passedAsIs");
});

});
