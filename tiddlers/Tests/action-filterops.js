/*\

Tests the action-filterops widget.

\*/

describe('ActionFilterOpsWidget', function() {

var wiki;

beforeEach(function() {
	wiki = new $tw.Wiki();
});

function testAdd(input, expected, value) {
	value = value || "value";
	wiki.addTiddler({title: "Target", text: input});
	wiki.addTiddler({title: value});
	var widgetNode = $tw.test.renderText(wiki,"\\define value() " + value + "\n<$action-filterops $tiddler=Target $field=text $add=<<value>> />");
	var oldResults = wiki.filterTiddlers(input, widgetNode);
	var expectedResults = oldResults;
	if (expectedResults.indexOf(value) < 0) {
		expectedResults.push(value);
	}
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

/*** Adding values to filter. ***/

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

it("add does not timestamp if no change is made", function() {
	testAdd("A B C value", "A B C value");
	expect(wiki.getTiddler("Target").fields.modified).toBeUndefined();
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

// I don't like this behavior. I'd rather remove the field if it's empty,
// but it's probably better to mimic listops in this way.
it("does not remove field if emptied", function() {
	wiki.addTiddler({title: "Target", filter: "value"});
	var widgetNode = $tw.test.renderText(wiki,"<$action-filterops $tiddler=Target $field=filter $remove=value />");
	widgetNode.invokeActions(widgetNode, {});
	var target = wiki.getTiddler("Target");
	expect(target.fields.filter).toBe("");
});

it("does not create field when removing", function() {
	wiki.addTiddler({title: "Target"});
	var widgetNode = $tw.test.renderText(wiki,"<$action-filterops $tiddler=Target $field=filter $remove=value />");
	widgetNode.invokeActions(widgetNode, {});
	var target = wiki.getTiddler("Target");
	expect(target.fields.filter).toBeUndefined();
});

it("remove does not timestamp if no change is made", function() {
	testRemove("A B C", "A B C");
	expect(wiki.getTiddler("Target").fields.modified).toBeUndefined();
});

/*** Reassembling ***/

it("can reassemble various types of filter structures", function() {
	// Capture the log because the regexp emits a deprecation warning
	spyOn(console, "log");
	testAdd("[match[x]]", "[match[x]] value");
	testAdd("[match{x}]", "[match{x}] value");
	testAdd("[match<x>]", "[match<x>] value");
	testAdd("[match/x/]", "[match/x/] value");
	testAdd("[!match[value]]", "[!match[value]] value");
	testAdd("[field:title[x]]", "[field:title[x]] value");
	testAdd("[[x]addsuffix[y]match[xy]]", "[[x]addsuffix[y]match[xy]] value");
	testAdd("[all[]] :filter[match[v]]", "[all[]] :filter[match[v]] value");
	testAdd("other", "other value");
	testAdd("'other'", "other value");
	testAdd("[[ot' \"her]]", "[[ot' \"her]] value");
});

/*** Timestamping ***/

it("timestamps by default", function() {
	testAdd("A B C", "A B C value");
	expect(wiki.getTiddler("Target").fields.modified).not.toBeUndefined();
});

it("timestamps explicitly", function() {
	wiki.addTiddler({title: "Target", text: "A B C"});
	var widgetNode = $tw.test.renderText(wiki,"<$action-filterops $tiddler=Target $field=text $add=value $timestamp=yes />");
	widgetNode.invokeActions(widgetNode, {});
	var target = wiki.getTiddler("Target");
	expect(target.fields.text).toBe("A B C value");
	expect(target.fields.modified).not.toBeUndefined();
});

it("does not timestamp modify when disabled", function() {
	wiki.addTiddler({title: "Target", text: "A B C"});
	var widgetNode = $tw.test.renderText(wiki,"<$action-filterops $tiddler=Target $field=text $add=value $timestamp=no />");
	widgetNode.invokeActions(widgetNode, {});
	var target = wiki.getTiddler("Target");
	expect(target.fields.text).toBe("A B C value");
	expect(target.fields.modified).toBeUndefined();
});

it("does not timestamp create when disabled", function() {
	var widgetNode = $tw.test.renderText(wiki,"<$action-filterops $tiddler=Target $field=text $add=value $timestamp=no />");
	widgetNode.invokeActions(widgetNode, {});
	var target = wiki.getTiddler("Target");
	expect(target.fields.text).toBe("value");
	expect(target.fields.created).toBeUndefined();
});

/*** Creation ***/

it("creates tiddler when does not exist", function() {
	var widgetNode = $tw.test.renderText(wiki,"<$action-filterops $tiddler=Target $field=text $add=value />");
	widgetNode.invokeActions(widgetNode, {});
	var target = wiki.getTiddler("Target");
	expect(target.fields.text).toBe("value");
	expect(target.fields.created).not.toBeUndefined();
});

it("creates field when does not exist", function() {
	wiki.addTiddler({title: "Target", text: "text"});
	var widgetNode = $tw.test.renderText(wiki,"<$action-filterops $tiddler=Target $field=filter $add=value />");
	widgetNode.invokeActions(widgetNode, {});
	var target = wiki.getTiddler("Target");
	expect(target.fields.text).toBe("text");
	expect(target.fields.filter).toBe("value");
});

});
