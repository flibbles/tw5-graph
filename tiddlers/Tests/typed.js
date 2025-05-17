/*\

Tests the following suite of macro widgets and filters:

$action-addtyped
$action-removetyped
$each.typed
[gettyped[]]

\*/

describe('Typed \\widgets', function() {

var wiki;

beforeEach(function() {
	wiki = new $tw.Wiki();
});

function relinkConfig(type, name="field") {
	return {title: "$:/config/flibbles/relink/fields/" + name, text: type};
};

function renderAction(text) {
	var widgetNode = $tw.test.renderText(wiki, text + "\n");
	// Action widgets should not be introducing content to the DOM.
	expect(widgetNode.parentDomNode.innerHTML).toBe("");
	return widgetNode;
};

it("handles unspecified field types as list", function() {
	wiki.addTiddler({title: "Target", field: "A -value B"});
	var addNode = renderAction("<$action-addtyped $tiddler=Target $field=field $value=value />");
	addNode.invokeActions(addNode, {});
	expect(wiki.getTiddler("Target").fields.field).toBe("A -value B value");
	var expected = ["A", "-value", "B", "value"];
	expect(wiki.filterTiddlers("[[Target]gettyped[field]]")).toEqual(expected);
	wiki.addTiddler({title: "Target", field: "A value 'value' B"});
	var removeNode = renderAction("<$action-removetyped $tiddler=Target $field=field $value=value />");
	removeNode.invokeActions(removeNode, {});
	expect(wiki.getTiddler("Target").fields.field).toBe("A 'value' B");
});

it("handles unrecognized field types (by ignoring them)", function() {
	wiki.addTiddler({title: "Target", field: "A B"});
	wiki.addTiddler(relinkConfig("bizarre"));
	var addNode = renderAction("<$action-addtyped $tiddler=Target $field=field $value=value />");
	addNode.invokeActions(addNode, {});
	expect(wiki.getTiddler("Target").fields.field).toBe("A B");
	expect(wiki.filterTiddlers("[[Target]gettyped[bizarre]]")).toEqual([]);
	wiki.addTiddler({title: "Target", field: "value"});
	var removeNode = renderAction("<$action-removetyped $tiddler=Target $field=field $value=value />");
	removeNode.invokeActions(removeNode, {});
	expect(wiki.getTiddler("Target").fields.field).toBe("value");
});

it("handles list field types", function() {
	wiki.addTiddler({title: "Target", field: "[[A B]] -value"});
	wiki.addTiddler(relinkConfig("list"));
	var addNode = renderAction("<$action-addtyped $tiddler=Target $field=field $value=value />");
	addNode.invokeActions(addNode, {});
	expect(wiki.getTiddler("Target").fields.field).toBe("[[A B]] -value value");
	var expected = ["A B", "-value", "value"];
	expect(wiki.filterTiddlers("[[Target]gettyped[field]]")).toEqual(expected);
	var removeNode = renderAction("<$action-removetyped $tiddler=Target $field=field $value=value />");
	removeNode.invokeActions(removeNode, {});
	expect(wiki.getTiddler("Target").fields.field).toBe("[[A B]] -value");
});

it("handles title field types", function() {
	wiki.addTiddler({title: "Target", field: "else"});
	wiki.addTiddler(relinkConfig("title"));
	var addNode = renderAction("<$action-addtyped $tiddler=Target $field=field $value='this value' />");
	addNode.invokeActions(addNode, {});
	expect(wiki.getTiddler("Target").fields.field).toBe("this value");
	var expected = ["this value"];
	expect(wiki.filterTiddlers("[[Target]gettyped[field]]")).toEqual(expected);
	var removeNode = renderAction("<$action-removetyped $tiddler=Target $field=field $value='this value' />");
	removeNode.invokeActions(removeNode, {});
	expect(wiki.getTiddler("Target").fields.field).toBeUndefined();
});

it("handles filter field types", function() {
	wiki.addTiddler({title: "A"});
	wiki.addTiddler({title: "this value"});
	wiki.addTiddler({title: "Target", field: "[all[]!is[system]] [{!!store}] -[[this value]]", store: "Stored"});
	wiki.addTiddler(relinkConfig("filter"));
	var addNode = renderAction("<$action-addtyped $tiddler=Target $field=field $value='this value' />");
	addNode.invokeActions(addNode, {});
	expect(wiki.getTiddler("Target").fields.field).toBe("[all[]!is[system]] [{!!store}]");
	// Now to test the filter operator
	var listNode = $tw.test.renderGlobal(wiki, "\\define currentTiddler() Target\n<$text text={{{ [[Target]gettyped[field]join[=]] }}} />");
	expect(listNode.parentDomNode.innerHTML).toBe("<p>A=Target=this value=Stored</p>");
	var removeNode = renderAction("<$action-removetyped $tiddler=Target $field=field $value='this value' />");
	removeNode.invokeActions(removeNode, {});
	expect(wiki.getTiddler("Target").fields.field).toBe("[all[]!is[system]] [{!!store}] -[[this value]]");
});

it("filters nothing when no operand supplied", function() {
	wiki.addTiddler({title: "Target"});
	expect(wiki.filterTiddlers("[[Target]gettyped[]]")).toEqual([]);
});

it("handles refresh", async function() {
	wiki.addTiddler({title: "Target"});
	wiki.addTiddler({title: "Field", text: "no"});
	var addNode = renderAction("<$action-addtyped $tiddler=Target $field={{Field}} $value=value />");
	wiki.addTiddler({title: "Field", text: "yes"});
	await $tw.test.flushChanges();
	addNode.invokeActions(addNode, {});
	expect(wiki.getTiddler("Target").fields.yes).toBe("value");
});

/*** Filter specific tests, because filters are more complicated. ***/

function testAdd(input, expected, value) {
	value = value || "value";
	wiki.addTiddler({title: "Target", filter: input});
	wiki.addTiddler({title: value});
	wiki.addTiddler(relinkConfig("filter", "filter"));
	var widgetNode = $tw.test.renderText(wiki,"\\define value() " + value + "\n<$action-addtyped $tiddler=Target $field=filter $value=<<value>> />");
	var oldResults = wiki.filterTiddlers(input, widgetNode);
	var expectedResults = oldResults;
	if (expectedResults.indexOf(value) < 0) {
		expectedResults.push(value);
	}
	widgetNode.invokeActions(widgetNode, {});
	var newFilter = wiki.getTiddler("Target").fields.filter;
	expect(newFilter).toBe(expected);
	var newResults = wiki.filterTiddlers(newFilter, widgetNode);
	expect(newResults).toEqual(expectedResults);
};

function testRemove(input, expected, value) {
	value = value || "value";
	wiki.addTiddler({title: "Target", filter: input});
	wiki.addTiddler({title: value});
	wiki.addTiddler(relinkConfig("filter", "filter"));
	var oldResults = wiki.filterTiddlers(input, widgetNode);
	var expectedResults = oldResults.filter((x) => x !== value);
	var widgetNode = $tw.test.renderText(wiki,"\\define value() " + value + "\n<$action-removetyped $tiddler=Target $field=filter $value=<<value>> />");
	widgetNode.invokeActions(widgetNode, {});
	var newFilter = wiki.getTiddler("Target").fields.filter;
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

/*** Standard behavior between all fieldtypes ***/

$tw.utils.each($tw.wiki.filterTiddlers("[[fieldtype]modules[]moduleproperty[name]]"), function(fieldType) {

	describe("(" + fieldType + ")", function() {

	beforeEach(function() {
		wiki.addTiddler(relinkConfig(fieldType));
		wiki.addTiddler({title: "Target", field: "value"});
	});

	it("add & remove timestamps by default", function() {
		var add = renderAction("<$action-addtyped $tiddler=Target $field=field $value=new />");
		add.invokeActions(add, {});
		expect(wiki.getTiddler("Target").fields.modified).not.toBeUndefined();
		wiki.addTiddler({title: "Target", field: "value"});
		var remove = renderAction("<$action-removetyped $tiddler=Target $field=field $value=value />");
		remove.invokeActions(remove, {});
		// It should have changed
		expect(wiki.getTiddler("Target").fields.modified).not.toBeUndefined();
	});

	it("add & remove timestamps explicitly", function() {
		var add = renderAction("<$action-addtyped $tiddler=Target $field=field $value=new $timestamp=yes />");
		add.invokeActions(add, {});
		var stamp = wiki.getTiddler("Target").fields.modified;
		expect(stamp).not.toBeUndefined();
		wiki.addTiddler({title: "Target", field: "value"});
		var remove = renderAction("<$action-removetyped $tiddler=Target $field=field $value=value $timestamp=yes />");
		remove.invokeActions(remove, {});
		// It should have changed
		expect(wiki.getTiddler("Target").fields.modified).not.toBeUndefined();
	});

	it("add & remove won't timestamp when disabled", function() {
		var add = renderAction("<$action-addtyped $tiddler=Target $field=field $value=new $timestamp=no />");
		add.invokeActions(add, {});
		expect(wiki.getTiddler("Target").fields.modified).toBeUndefined();
		var remove = renderAction("<$action-removetyped $tiddler=Target $field=field $value=new $timestamp=no />");
		remove.invokeActions(remove, {});
		expect(wiki.getTiddler("Target").fields.modified).toBeUndefined();
	});

	it("remove ignores missing values", function() {
		var remove = renderAction("<$action-removetyped $tiddler=Target $field=field $value=else />");
		remove.invokeActions(remove, {});
		var tiddler = wiki.getTiddler("Target");
		expect(tiddler.fields.field).toBe("value");
		expect(tiddler.fields.modified).toBeUndefined();
	});

	it("add ignores redundant additions", function() {
		var add = renderAction("<$action-addtyped $tiddler=Target $field=field $value=value />");
		add.invokeActions(add, {});
		var tiddler = wiki.getTiddler("Target");
		expect(tiddler.fields.field).toBe("value");
		expect(tiddler.fields.modified).toBeUndefined();
	});

	it("remove clears the field when not specified", function() {
		var remove = renderAction("<$action-removetyped $tiddler=Target $field=field $value=value />");
		remove.invokeActions(remove, {});
		var tiddler = wiki.getTiddler("Target");
		expect(tiddler.fields.field).toBeUndefined();
	});

	it("remove doesn't clear the field when told not to", function() {
		var remove = renderAction("<$action-removetyped $tiddler=Target $field=field $value=value $clean=no />");
		remove.invokeActions(remove, {});
		var tiddler = wiki.getTiddler("Target");
		expect(tiddler.fields.field).toBe("");
	});

	it("remove clears the field when told to do so", function() {
		var remove = renderAction("<$action-removetyped $tiddler=Target $field=field $value=value $clean=yes />");
		remove.invokeActions(remove, {});
		var tiddler = wiki.getTiddler("Target");
		expect(tiddler.fields.field).toBeUndefined();
	});

	it("add creates field when field does not exist", function() {
		wiki.addTiddler({title: "Target"});
		var add = renderAction("<$action-addtyped $tiddler=Target $field=field $value=value />");
		add.invokeActions(add, {});
		var tiddler = wiki.getTiddler("Target");
		expect(tiddler.fields.field).toBe("value");
	});

	it("add creates tiddler and field when tiddler does not exist", function() {
		wiki.addTiddler({title: "Target"});
		var add = renderAction("<$action-addtyped $tiddler=Other $field=field $value=value />");
		add.invokeActions(add, {});
		var tiddler = wiki.getTiddler("Other");
		expect(tiddler.fields.field).toBe("value");
	});

	it("remove doesn't create field when field does not exist", function() {
		wiki.addTiddler({title: "Target"});
		var add = renderAction("<$action-removetyped $tiddler=Target $field=field $value=value />");
		add.invokeActions(add, {});
		expect(wiki.getTiddler("Target").fields.field).toBeUndefined();
	});

	it("remove doesn't create tiddler when tiddler does not exist", function() {
		wiki.addTiddler({title: "Target"});
		var add = renderAction("<$action-removetyped $tiddler=Other $field=field $value=value />");
		add.invokeActions(add, {});
		expect(wiki.tiddlerExists("Other")).toBe(false);
	});

	it("filters nothing with missing tiddler", function() {
		expect(wiki.filterTiddlers("[[Missing]gettyped[field]]")).toEqual([]);
	});

	it("filters nothing with missing field", function() {
		expect(wiki.filterTiddlers("[[Target]gettyped[missing]]")).toEqual([]);
	});

	it("filters nothing with blank field", function() {
		wiki.addTiddler({title: "Empty", field: ""});
		expect(wiki.filterTiddlers("[[Empty]gettyped[field]]")).toEqual([]);
	});
});

});

});
