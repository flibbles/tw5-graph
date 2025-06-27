/*\

Tests the :cache filterrunprefix.

\*/

describe(':cache filterrunprefix', function() {

var wiki, each;

function makeWidget(variables) {
	var ptr = wiki.makeWidget(null, {variables: variables});
	ptr.render();
	while (ptr.children && ptr.children.length > 0) {
		ptr = ptr.children[0];
	}
	return ptr;
};

beforeEach(function() {
	wiki = new $tw.Wiki();
	each = spyOn(wiki, "each").and.callThrough();
});

it("runs simply", function() {
	var filter = ":cache[all[tiddlers]prefix[A]]";
	wiki.addTiddlers([{title: "A"}, {title: "B"}]);
	expect(wiki.filterTiddlers(filter)).toEqual(["A"]);
	expect(wiki.filterTiddlers(filter)).toEqual(["A"]);
	expect(each).toHaveBeenCalledTimes(1);
	wiki.addTiddler({title: "Also"});
	expect(wiki.filterTiddlers(filter)).toEqual(["A", "Also"]);
	expect(each).toHaveBeenCalledTimes(2);
});

it("manages internal filter compile cache refresh", function() {
	// The core filter compiler uses a caching mechanism that we're
	// piggybacking off of. However, it refreshes after a certain maximum
	// number of filters have been cached. :cache will need to refresh
	// after that too. 2000 currently.
	var filter = ":cache[all[tiddlers]prefix[A]]";
	wiki.addTiddlers([{title: "A"}, {title: "B"}]);
	expect(wiki.filterTiddlers(filter)).toEqual(["A"]);
	expect(wiki.filterTiddlers(filter)).toEqual(["A"]);
	expect(each).toHaveBeenCalledTimes(1);
	for (var i = 0; i < 2005; i++) {
		// Let's quickly compile over 2000 tiddlers to force a cache reset.
		wiki.filterTiddlers(i.toString());
	}
	expect(wiki.filterTiddlers(filter)).toEqual(["A"]);
	expect(each).toHaveBeenCalledTimes(2);
});

it("throws out input", function() {
	expect(wiki.filterTiddlers("[enlist[A B]] :cache[addsuffix[X]]")).toEqual([]);
});

it("ignores source", function() {
	wiki.addTiddler({title: "Anything"});
	expect(wiki.filterTiddlers(":cache[all[]addsuffix[X]]")).toEqual([]);
	expect(each).not.toHaveBeenCalled();
});

it("multiple cache runs can be in the same filter", function() {
	wiki.addTiddlers([
		{title: "Apples"},
		{title: "Bananas"},
		{title: "Carrots"},
		{title: "Dates"}]);
	var filter= "A C :cache[all[tiddlers]prefix{!!title}]";
	expect(wiki.filterTiddlers(filter)).toEqual(["Apples", "Carrots"]);
	expect(each).toHaveBeenCalledTimes(2);
	expect(wiki.filterTiddlers(filter)).toEqual(["Apples", "Carrots"]);
	expect(each).toHaveBeenCalledTimes(2);
});

it("appends like :map", function() {
	var filter = "A B =A C :cache[{!!title}]";
	expect(wiki.filterTiddlers(filter)).toEqual(["A", "B", "A", "C"]);
});

it("can handle different currentTiddlers in run", function() {
	wiki.addTiddlers([
		{title: "A"}, {title: "B"}, {title: "C"}]);
	var filter = "[<value>] :cache[all[tiddlers]prefix[X]else[value-]addsuffix{!!title}]";
	var Bwidget = makeWidget({value: "B"});
	expect(wiki.filterTiddlers(filter, Bwidget)).toEqual(["value-B"]);
	var Cwidget = makeWidget({value: "C"});
	expect(wiki.filterTiddlers(filter, Cwidget)).toEqual(["value-C"]);
	expect(wiki.filterTiddlers(filter, Bwidget)).toEqual(["value-B"]);
	expect(each).toHaveBeenCalledTimes(2);
});

it("can recover other variables", function() {
	// Once cache can support multiple variables, this test will have to go.
	wiki.addTiddlers([
		{title: "A"}, {title: "B"}, {title: "C"}]);
	var filter = ":cache[all[tiddlers]addsuffix<value>addprefix<currentTiddler>]";
	var widget = makeWidget({value: "x", currentTiddler: "CT"});
	expect(wiki.filterTiddlers(filter, widget)).toEqual(["Ax", "Bx", "Cx"]);
	widget = makeWidget({value: "y", currentTiddler: "CT"});
	expect(wiki.filterTiddlers(filter, widget)).toEqual(["Ay", "By", "Cy"]);
	expect(wiki.filterTiddlers(filter, widget)).toEqual(["Ay", "By", "Cy"]);
	expect(each).toHaveBeenCalledTimes(2);
});

it("can deal with variable number of variable calls", function() {
	var filter = ":cache[all[tiddlers]prefix[X]subfilter<sub>]";
	var subfilter =  "[<X>match[short]] ~[[$(Y)$-$(Z)$]substitute[]]";
	function test(variables, expected) {
		variables.sub = subfilter;
		var widget = makeWidget(variables);
		expect(wiki.filterTiddlers(filter, widget)).toEqual(expected);
	};
	test({X: "short", Y: "A", Z: "B"}, ["short"]);
	test({X: "short", Y: "C", Z: "B"}, ["short"]);
	test({X: "short", Y: "C", Z: "D"}, ["short"]);
	expect(each).toHaveBeenCalledTimes(1);
	test({X: "long", Y: "A", Z: "B"}, ["A-B"]);
	test({X: "long", Y: "C", Z: "B"}, ["C-B"]);
	test({X: "long", Y: "C", Z: "D"}, ["C-D"]);
	expect(each).toHaveBeenCalledTimes(4);
});

it("can deal with variables that take parameters", function() {
	var text = `\\function .wrap(X) [[{$(X)$}]substitute[]]\n<$text text={{{ :cache[all[tiddlers]prefix[X].wrap<value>] }}} />\n`;
	var widget;
	widget = $tw.test.renderText(wiki, "\\procedure value() A\n" + text);
	expect(widget.parentDomNode.innerHTML).toBe("{A}");
	widget = $tw.test.renderText(wiki, "\\procedure value() A\n" + text);
	expect(widget.parentDomNode.innerHTML).toBe("{A}");
	expect(each).toHaveBeenCalledTimes(1);
	widget = $tw.test.renderText(wiki, text);
	expect(widget.parentDomNode.innerHTML).toBe("{}");
	expect(each).toHaveBeenCalledTimes(2);
});

it("does not get tripped up by internal fake widgets", function() {
	var text = `\\procedure currentTiddler() bad\n\\function .inner() [{!!title}]\n<$text text={{{ [[expected]] :cache[all[tiddlers]prefix[X].inner<value>] }}} />\n`;
	var widget = $tw.test.renderText(wiki, text);
	expect(widget.parentDomNode.innerHTML).toBe("expected");
});

it("does not get tripped up by internal fake widgets when nested", function() {
	var preamble = `\\procedure currentTiddler() bad
\\function .inner() [{!!title}]
\\function .outer() [all[]] :cache[all[tiddlers]prefix[X].inner[]]\n`;
	var widget = $tw.test.renderText(wiki, preamble + "<$text text={{{ [[first].outer[]] }}} />\n");
	expect(widget.parentDomNode.innerHTML).toBe("first");
	// Now run it again
	widget = $tw.test.renderText(wiki, preamble + "<$text text={{{ [[first].outer[]] }}} />\n");
	expect(widget.parentDomNode.innerHTML).toBe("first");
	expect(each).toHaveBeenCalledTimes(1);
	// Now run it with another currentTiddler
	widget = $tw.test.renderText(wiki, preamble + "<$text text={{{ [[second].outer[]] }}} />\n");
	expect(widget.parentDomNode.innerHTML).toBe("second");
	expect(each).toHaveBeenCalledTimes(2);
});

/** This seems like a pretty classic use case that cache should be good for **/
it("supports fibonacci", function() {
	var widget = $tw.test.renderText(wiki, `\\function fibonacci-cache() [all[]] :cache[function[fibonacci],<currentTiddler>]
\\function fibonacci(number) [<number>compare::lt[2]] ~[enlist[-1 -2]add<number>function[fibonacci-cache]sum[]]
<<fibonacci 6>>`);
	expect(widget.parentDomNode.innerHTML).toBe("<p>8</p>");
});

});
