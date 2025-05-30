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

it("currently does not expose any variables", function() {
	// Once cache can support multiple variables, this test will have to go.
	wiki.addTiddlers([
		{title: "A"}, {title: "B"}, {title: "C"}]);
	var filter = ":cache[all[tiddlers]addsuffix<value>addprefix<currentTiddler>]";
	var widget = makeWidget({value: "B", currentTiddler: "CT"});
	expect(wiki.filterTiddlers(filter, widget)).toEqual(["A", "B", "C"]);
	widget = makeWidget({value: "C", currentTiddler: "CT"});
	expect(wiki.filterTiddlers(filter, widget)).toEqual(["A", "B", "C"]);
	expect(each).toHaveBeenCalledTimes(1);
});

});
