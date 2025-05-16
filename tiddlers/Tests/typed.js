/*\

Tests the following suite of macro widgets and filters:

$action.addtyped
$action.removetyped
$each.typed
[gettyped[]]

\*/

describe('Typed \\widgets', function() {

var wiki;

beforeEach(function() {
	wiki = new $tw.Wiki();
	var pluginInfo = $tw.wiki.getPluginInfo("$:/plugins/flibbles/graph");
	wiki.addTiddlers(Object.values(pluginInfo.tiddlers));
	wiki.addTiddler($tw.wiki.getTiddler("$:/core/config/GlobalImportFilter"));
});

function relinkConfig(type) {
	return {title: "$:/config/flibbles/relink/fields/field", text: type};
};

function renderAction(text) {
	var widgetNode = $tw.test.renderText(wiki, "\\import [subfilter{$:/core/config/GlobalImportFilter}]\n" + text + "\n");
	// Action widgets should not be introducing content to the DOM.
	expect(widgetNode.parentDomNode.innerHTML).toBe("");
	return widgetNode;
};

it("handles unspecified field types as list", function() {
	wiki.addTiddler({title: "Target", field: "A -value B"});
	var addNode = renderAction("<$action.addtyped $tiddler=Target $field=field $value=value />");
	addNode.invokeActions(addNode, {});
	expect(wiki.getTiddler("Target").fields.field).toBe("A -value B value");
	var expected = ["A", "-value", "B", "value"];
	expect(wiki.filterTiddlers("[[Target]gettyped[field]]")).toEqual(expected);
	wiki.addTiddler({title: "Target", field: "A value 'value' B"});
	var removeNode = renderAction("<$action.removetyped $tiddler=Target $field=field $value=value />");
	removeNode.invokeActions(removeNode, {});
	expect(wiki.getTiddler("Target").fields.field).toBe("A 'value' B");
});

it("handles unrecognized field types (by ignoring them)", function() {
	wiki.addTiddler({title: "Target", field: "A B"});
	wiki.addTiddler(relinkConfig("bizarre"));
	var addNode = renderAction("<$action.addtyped $tiddler=Target $field=field $value=value />");
	addNode.invokeActions(addNode, {});
	expect(wiki.getTiddler("Target").fields.field).toBe("A B");
	expect(wiki.filterTiddlers("[[Target]gettyped[bizarre]]")).toEqual([]);
	wiki.addTiddler({title: "Target", field: "value"});
	var removeNode = renderAction("<$action.removetyped $tiddler=Target $field=field $value=value />");
	removeNode.invokeActions(removeNode, {});
	expect(wiki.getTiddler("Target").fields.field).toBe("value");
});

it("handles list field types", function() {
	wiki.addTiddler({title: "Target", field: "[[A B]] -value"});
	wiki.addTiddler(relinkConfig("list"));
	var addNode = renderAction("<$action.addtyped $tiddler=Target $field=field $value=value />");
	addNode.invokeActions(addNode, {});
	expect(wiki.getTiddler("Target").fields.field).toBe("[[A B]] -value value");
	var expected = ["A B", "-value", "value"];
	expect(wiki.filterTiddlers("[[Target]gettyped[field]]")).toEqual(expected);
	var removeNode = renderAction("<$action.removetyped $tiddler=Target $field=field $value=value />");
	removeNode.invokeActions(removeNode, {});
	expect(wiki.getTiddler("Target").fields.field).toBe("[[A B]] -value");
});

it("handles title field types", function() {
	wiki.addTiddler({title: "Target", field: "else"});
	wiki.addTiddler(relinkConfig("title"));
	var addNode = renderAction("<$action.addtyped $tiddler=Target $field=field $value='this value' />");
	addNode.invokeActions(addNode, {});
	expect(wiki.getTiddler("Target").fields.field).toBe("this value");
	var expected = ["this value"];
	expect(wiki.filterTiddlers("[[Target]gettyped[field]]")).toEqual(expected);
	var removeNode = renderAction("<$action.removetyped $tiddler=Target $field=field $value='this value' />");
	removeNode.invokeActions(removeNode, {});
	expect(wiki.getTiddler("Target").fields.field).toBeUndefined();
});

it("handles filter field types", function() {
	wiki.addTiddler({title: "A"});
	wiki.addTiddler({title: "this value"});
	wiki.addTiddler({title: "Target", field: "[all[]!is[system]] [{!!store}] -[[this value]]", store: "Stored"});
	wiki.addTiddler(relinkConfig("filter"));
	var addNode = renderAction("<$action.addtyped $tiddler=Target $field=field $value='this value' />");
	addNode.invokeActions(addNode, {});
	expect(wiki.getTiddler("Target").fields.field).toBe("[all[]!is[system]] [{!!store}]");
	// Now to test the filter operator
	var listNode = $tw.test.renderGlobal(wiki, "\\define currentTiddler() Target\n<$text text={{{ [[Target]gettyped[field]join[=]] }}} />");
	expect(listNode.parentDomNode.innerHTML).toBe("<p>A=Target=this value=Stored</p>");
	var removeNode = renderAction("<$action.removetyped $tiddler=Target $field=field $value='this value' />");
	removeNode.invokeActions(removeNode, {});
	expect(wiki.getTiddler("Target").fields.field).toBe("[all[]!is[system]] [{!!store}] -[[this value]]");
});

it("filters nothing when no operand supplied", function() {
	wiki.addTiddler({title: "Target"});
	expect(wiki.filterTiddlers("[[Target]gettyped[]]")).toEqual([]);
});

/*** Standard behavior between all fieldtypes ***/

$tw.utils.each($tw.wiki.filterTiddlers("[all[tiddlers+shadows]removeprefix[$:/plugins/flibbles/graph/fieldtypes/]]"), function(fieldType) {

	describe("(" + fieldType + ")", function() {

	beforeEach(function() {
		wiki.addTiddler(relinkConfig(fieldType));
		wiki.addTiddler({title: "Target", field: "value"});
	});

	it("remove ignores missing values", function() {
		var remove = renderAction("<$action.removetyped $tiddler=Target $field=field $value=else />");
		remove.invokeActions(remove, {});
		var tiddler = wiki.getTiddler("Target");
		expect(tiddler.fields.field).toBe("value");
		expect(tiddler.fields.modified).toBeUndefined();
	});

	it("add ignores redundant additions", function() {
		var add = renderAction("<$action.addtyped $tiddler=Target $field=field $value=value />");
		add.invokeActions(add, {});
		var tiddler = wiki.getTiddler("Target");
		expect(tiddler.fields.field).toBe("value");
		expect(tiddler.fields.modified).toBeUndefined();
	});

	it("remove clears the field when emptied", function() {
		var remove = renderAction("<$action.removetyped $tiddler=Target $field=field $value=value />");
		remove.invokeActions(remove, {});
		var tiddler = wiki.getTiddler("Target");
		expect(tiddler.fields.field).toBeUndefined();
	});

	it("add creates field when field does not exist", function() {
		wiki.addTiddler({title: "Target"});
		var add = renderAction("<$action.addtyped $tiddler=Target $field=field $value=value />");
		add.invokeActions(add, {});
		var tiddler = wiki.getTiddler("Target");
		expect(tiddler.fields.field).toBe("value");
	});

	it("add creates tiddler and field when tiddler does not exist", function() {
		wiki.addTiddler({title: "Target"});
		var add = renderAction("<$action.addtyped $tiddler=Other $field=field $value=value />");
		add.invokeActions(add, {});
		var tiddler = wiki.getTiddler("Other");
		expect(tiddler.fields.field).toBe("value");
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
