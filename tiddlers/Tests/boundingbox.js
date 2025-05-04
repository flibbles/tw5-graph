/*\

Tests the boundingbox widget.

\*/

describe('BoundingBoxWidget', function() {

var wiki, register, window;

beforeEach(function() {
	wiki = new $tw.Wiki();
	({register, window} = $tw.test.setSpies());
});

function clean(objects) {
	objects.edges = Object.values(objects.edges);
	return objects;
};

function onlyCallOf(spy) {
	expect(spy).toHaveBeenCalledTimes(1);
	return spy.calls.first().args;
};

/*** garbage handling ***/

it("detects when to destroy itself", async function() {
	register.and.callThrough();
	wiki.addTiddler({title: "View", text: "yes"});
	var widgetNode = $tw.test.renderText(wiki, "<%if [{View}!match[no]] %><$boundingbox />");
	widgetNode.document.body = {
		contains: function(node) {
			while (node) {
				if (node === widgetNode.parentDomNode) {
					return true;
				}
				// Now check and make sure the parent has this as a child.
				if (!node.parentNode
				|| node.parentNode.childNodes.indexOf(node) < 0) {
					return false;
				}
				node = node.parentNode;
			}
		}
	};
	await $tw.test.flushChanges();
	$tw.test.utils.upkeep();
	expect(register).toHaveBeenCalled();
	register.calls.reset();
	// Now we put in a change that will
	wiki.addTiddler({title: "View", text: "no"});
	await $tw.test.flushChanges();
	$tw.test.utils.upkeep();
	expect(window().eventListeners.size).toBe(0);
});

/*** class ***/

it("can accept custom classes", async function() {
	wiki.addTiddler({title: "Class", text: "custom-class"});
	var text =  "<$boundingbox class={{Class}} />\n";
	var widgetNode = $tw.test.renderText(wiki, text);
	expect(widgetNode.parentDomNode.children[0].className).toContain("boundingbox custom-class");
	wiki.addTiddler({title: "Class", text: "new-class"});
	await $tw.test.flushChanges();
	expect(widgetNode.parentDomNode.children[0].className).toContain("boundingbox new-class");
});

/*** dimensions ***/

it("resizes on literal dimension changes", async function() {
	wiki.addTiddler({title: "dimensions", text: "247"});
	var widgetNode = $tw.test.renderText(wiki, "<$boundingbox $height={{dimensions}} $width={{dimensions}}/>");
	await $tw.test.flushChanges();
	expect(widgetNode.parentDomNode.innerHTML).toContain("height:247");
	expect(widgetNode.parentDomNode.innerHTML).toContain("width:247");
	wiki.addTiddler({title: "dimensions", text: "300"});
	await $tw.test.flushChanges();
	// We want to update the dimensions, but not refresh the graph
	expect(widgetNode.parentDomNode.innerHTML).toContain("height:300");
	expect(widgetNode.parentDomNode.innerHTML).toContain("width:300");
});

it("resizes on filter dimension changes", async function() {
	wiki.addTiddler({title: "dimensions", text: "27"});
	var widgetNode = $tw.test.renderText(wiki, "\\function .D() [{dimensions}]\n<$boundingbox $height='[<.D>]' $width='[<.D>add[10]]'>");
	await $tw.test.flushChanges();
	expect(widgetNode.parentDomNode.innerHTML).toContain("width:37;height:27;");
	wiki.addTiddler({title: "dimensions", text: "30"});
	await $tw.test.flushChanges();
	expect(widgetNode.parentDomNode.innerHTML).toContain("width:40;height:30;");
});

it("can remove dimension attributes", async function() {
	wiki.addTiddler({title: "dimensions", text: "27"});
	var widgetNode = $tw.test.renderText(wiki, "<$boundingbox $height={{dimensions}} $width={{dimensions}} />\n\n");
	await $tw.test.flushChanges();
	expect(widgetNode.parentDomNode.innerHTML).toContain("width:27;height:27;");
	wiki.addTiddler({title: "dimensions"});
	await $tw.test.flushChanges();
	// There will still be style="height:;width:;", but I don't know how to
	// get rid of that.
	expect(widgetNode.parentDomNode.innerHTML).not.toContain(":27;");
});

it("can have dimension attributes return nothing", async function() {
	wiki.addTiddler({title: "dimensions", text: "27"});
	var widgetNode = $tw.test.renderText(wiki, "<$boundingbox $height='[{dimensions}]' $width='[{dimensions}]' />\n");
	await $tw.test.flushChanges();
	expect(widgetNode.parentDomNode.innerHTML).toContain("width:27;height:27;");
	wiki.addTiddler({title: "dimensions"});
	await $tw.test.flushChanges();
	// There will still be style="height:;width:;", but I don't know how to
	// get rid of that.
	expect(widgetNode.parentDomNode.innerHTML).not.toContain(":27;");
});

it("does not write any style info if no dimensions supplied", function() {
	function render(text) {
		return wiki.renderText("text/html", "text/vnd.tiddlywiki", text);
	};
	expect(render("<$boundingbox/>\n\n")).toBe('<div class="boundingbox"></div>');
	expect(render("<$boundingbox $width='' $height=''/>\n\n")).toBe('<div class="boundingbox"></div>');
	expect(render("<$boundingbox $width=5px/>\n\n")).toBe('<div class="boundingbox" style="width:5px;"></div>');
	expect(render("<$boundingbox $height=5px/>\n\n")).toBe('<div class="boundingbox" style="height:5px;"></div>');
	// Has a filter, but filter returns nothing
	expect(render("<$boundingbox $width='[match[x]]' $height='[match[x]]'/>\n")).toBe('<div class="boundingbox"></div>');
	expect(render("<$boundingbox $width='[[]]' $height='[[]]'/>\n")).toBe('<div class="boundingbox"></div>');
});

it("can use browser info for dimension attributes", function() {
	var createElement = $tw.fakeDocument.createElement;
	spyOn($tw.fakeDocument, "createElement").and.callFake(function() {
		var element = createElement.apply(this, arguments);
		element.getBoundingClientRect = () => ({top: 17, left: 13});
		return element;
	});
	function test(text, expected) {
		var output = wiki.renderText("text/html", "text/vnd.tiddlywiki", text);
		expect(output).toContain(expected);
	};
	var win = window();
	win.innerWidth = 53;
	win.innerHeight = 34;
	test("<$boundingbox $width='[<windowWidth>]'/>\n", "width:53;");
	test("<$boundingbox $height='[<windowHeight>]'/>\n", "height:34;");
	test("<$boundingbox $width='[<boundingLeft>]'/>\n", "width:13;");
	test("<$boundingbox $height='[<boundingTop>]'/>\n", "height:17;");
});

it("handles resize events", function() {
	var win = window();
	win.innerWidth = 53;
	win.innerHeight = 34;
	var widgetNode = $tw.test.renderText(wiki, "<$boundingbox $height='[<windowHeight>]' $width='[<windowWidth>]' />\n");
	expect(widgetNode.parentDomNode.innerHTML).toContain("width:53;height:34;");
	win.innerWidth = 7;
	win.innerHeight = 11;
	win.dispatchEvent({type: "resize"});
	expect(widgetNode.parentDomNode.innerHTML).toContain("width:7;height:11;");
});

});
