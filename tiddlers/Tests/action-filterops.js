/*\

Tests the action-filterops widget.

\*/

fdescribe('ActionFilterOpsWidget', function() {

var wiki;

beforeEach(function() {
	wiki = new $tw.Wiki();
});

function testAdd(input, expected, value) {
	value = value || "value";
	wiki.addTiddler({title: "Target", text: input});
	wiki.addTiddler({title: value});
	var oldResults = wiki.filterTiddlers(input, widgetNode);
	var expectedResults = oldResults;
	if (expectedResults.indexOf(value) < 0) {
		expectedResults.push(value);
	}
	var widgetNode = $tw.test.renderText(wiki,"\\define value() " + value + "\n<$action-filterops $tiddler=Target $field=text $add=<<value>> />");
	widgetNode.invokeActions(widgetNode, {});
	var newFilter = wiki.getTiddlerText("Target");
	expect(newFilter).toBe(expected);
	var newResults = wiki.filterTiddlers(newFilter, widgetNode);
	expect(newResults).toEqual(expectedResults);
};

function testRemove(input, expected, value) {
	value = value || "value";
	wiki.addTiddler({title: "Target", text: input});
	wiki.addTiddler({title: value});
	var oldResults = wiki.filterTiddlers(input, widgetNode);
	var expectedResults = oldResults.filter((x) => x !== value);
	var widgetNode = $tw.test.renderText(wiki,"\\define value() " + value + "\n<$action-filterops $tiddler=Target $field=text $remove=<<value>> />");
	widgetNode.invokeActions(widgetNode, {});
	var newFilter = wiki.getTiddlerText("Target");
	expect(newFilter).toBe(expected);
	var newResults = wiki.filterTiddlers(newFilter, widgetNode);
	expect(newResults).toEqual(expectedResults);
};

// We won' have more than one test that actually sets ms to something
// positive, because it's time expensive.
it('can add', function() {
	testAdd("A B C", "A B C value");
	testAdd("A B value C", "A B value C");
	testAdd("A B C -value", "A B C value");
	testAdd("A -value B C", "A B C value");
	testAdd("[[v]addsuffix[alue]]", "[[v]addsuffix[alue]]");
	testAdd("[[v]addsuffix[alue]] -value", "[[v]addsuffix[alue]]");
	testAdd("value +[addsuffix[xx]]", "value +[addsuffix[xx]] value");
	testAdd("[enlist[A B C value]] -value +[addsuffix[xx]]",
	        "[enlist[A B C value]] -value +[addsuffix[xx]] value");
	testAdd("[all[]] -value [all[tags]]", "[all[]] [all[tags]]");
	testAdd("[all[tags]] -value [all[]]", "[all[tags]] -value [all[]]");
});

it("add can access the variable stack", function() {
	wiki.addTiddler({title: "Target", text: "[{!!list}]", list: "value"});
	var widgetNode = $tw.test.renderText(wiki,"\\define currentTiddler() Target\n<$action-filterops $tiddler=Target $field=text $add=value />");
	widgetNode.invokeActions(widgetNode, {});
	expect(wiki.getTiddlerText("Target")).toBe("[{!!list}]");
});

it("add runs against [all[]] as source", function() {
	testAdd("[prefix[v]]", "[prefix[v]]", "value");
});

it("add chooses best quotes", function() {
	testAdd("A B C", "A B C [[X X]]", "X X");
	testAdd("A B C", "A B C X'\"X", "X'\"X");
	testAdd("A B C", "A B C [[X [[X]]", "X [[X");
	testAdd("A B C", "A B C 'X]]X'", "X]]X");
	testAdd("A B C", "A B C \"X']]X\"", "X']]X");
	testAdd("A B C", "A B C [[:prefix]]", ":prefix");
	testAdd("A B C", "A B C [[-except]]", "-except");
	testAdd("A B C", "A B C [[+and]]", "+and");
	testAdd("A B C", "A B C [[~else]]", "~else");
	testAdd("A B C", "A B C [[=all]]", "=all");
	testAdd("A B C", "A B C p:refix", "p:refix");
	testAdd("A B C", "A B C e-xcept", "e-xcept");
	testAdd("A B C", "A B C a+nd", "a+nd");
	testAdd("A B C", "A B C e~lse", "e~lse");
	testAdd("A B C", "A B C a=ll", "a=ll");
});

/*** Removing values from filter. ***/

it("can remove", function() {
	testRemove("A B C value", "A B C");
	testRemove("value A B C", "A B C");
	testRemove("value A B C value", "A B C");
	testRemove("[all[]]", "[all[]] -value");
	testRemove("[all[tags]]", "[all[tags]]");
	testRemove("A B C value +[addsuffix[x]]", "A B C value +[addsuffix[x]]");
	testRemove("val value +[addsuffix[ue]]", "val value +[addsuffix[ue]] -value");
	testRemove("A B val +[addsuffix[ue]]", "A B val +[addsuffix[ue]] -value");
	testRemove("A B value [all[tags]]", "A B [all[tags]]");
	testRemove("A B value [all[]]", "A B [all[]] -value");
});

});
