/*\

Tests the following suite of macro widgets:

$action.addtyped
$action.removetyped
$each.typed

\*/

describe('ActionAddEdge \\widget', function() {

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

function links(array) {
	return array.map(a => `<a class="tc-tiddlylink tc-tiddlylink-missing" href="#${encodeURIComponent(a)}">${a}</a>`).join("");
};

it("handles unspecified field types as list", function() {
	wiki.addTiddler({title: "Target", field: "A -value B"});
	var addNode = renderAction("<$action.addtyped $tiddler=Target $field=field $value=value />");
	addNode.invokeActions(addNode, {});
	expect(wiki.getTiddler("Target").fields.field).toBe("A -value B value");
	var listNode = $tw.test.renderGlobal(wiki, "<$each.typed $tiddler=Target $field=field />\n");
	expect(listNode.parentDomNode.innerHTML).toBe(links(["A", "-value", "B", "value"]));
	wiki.addTiddler({title: "Target", field: "A value 'value' B"});
	var removeNode = renderAction("<$action.removetyped $tiddler=Target $field=field $value=value />");
	removeNode.invokeActions(removeNode, {});
	expect(wiki.getTiddler("Target").fields.field).toBe("A 'value' B");
});

it("ignores unrecognized field types", function() {
	wiki.addTiddler({title: "Target", field: "A B"});
	wiki.addTiddler(relinkConfig("bizarre"));
	var addNode = renderAction("<$action.addtyped $tiddler=Target $field=field $value=value />");
	addNode.invokeActions(addNode, {});
	expect(wiki.getTiddler("Target").fields.field).toBe("A B");
	var listNode = $tw.test.renderGlobal(wiki, "<$each.typed $tiddler=Target $field=field />\n");
	expect(listNode.parentDomNode.innerHTML).toBe("");
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
	var listNode = $tw.test.renderGlobal(wiki, "<$each.typed $tiddler=Target $field=field />\n");
	expect(listNode.parentDomNode.innerHTML).toBe(links(["A B", "-value", "value"]));
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
	var listNode = $tw.test.renderGlobal(wiki, "<$each.typed $tiddler=Target $field=field />\n");
	expect(listNode.parentDomNode.innerHTML).toBe(links(["this value"]));
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
	var listNode = $tw.test.renderGlobal(wiki, "\\define currentTiddler() Target\n<$each.typed $tiddler=Target $field=field >\n\n<$text text={{!!title}}/>");
	expect(listNode.parentDomNode.innerHTML).toBe("<p>A</p><p>Target</p><p>this value</p><p>Stored</p>");
	var removeNode = renderAction("<$action.removetyped $tiddler=Target $field=field $value='this value' />");
	removeNode.invokeActions(removeNode, {});
	expect(wiki.getTiddler("Target").fields.field).toBe("[all[]!is[system]] [{!!store}] -[[this value]]");
});

/*** Standard behavior between all fieldtypes ***/

$tw.utils.each($tw.wiki.filterTiddlers("[all[tiddlers+shadows]removeprefix[$:/plugins/flibbles/graph/fieldtypes/]]"), function(fieldType) {

	describe("(" + fieldType + ")", function() {

	beforeEach(function() {
		wiki.addTiddler(relinkConfig(fieldType));
		wiki.addTiddler({title: "Target", field: "value"});
	});

	it("ignores missed removals", function() {
		var remove = renderAction("<$action.removetyped $tiddler=Target $field=field $value=else />");
		remove.invokeActions(remove, {});
		var tiddler = wiki.getTiddler("Target");
		expect(tiddler.fields.field).toBe("value");
		expect(tiddler.fields.modified).toBeUndefined();
	});

	it("clears the field when emptied", function() {
		var remove = renderAction("<$action.removetyped $tiddler=Target $field=field $value=value />");
		remove.invokeActions(remove, {});
		var tiddler = wiki.getTiddler("Target");
		expect(tiddler.fields.field).toBeUndefined();
	});

	it("renders nothing with missing tiddler", function() {
		var widget = renderAction("<$each.typed $field=field $tiddler=Missing />");
		var edgeObjects = $tw.test.fetchGraphObjects(widget).edges;
		expect(edgeObjects).toBeUndefined();
	});

	it("renders nothing with missing field", function() {
		wiki.addTiddler({title: "Fieldless"});
		var widget = renderAction("<$each.typed $field=field $tiddler=Fieldless />");
		var edgeObjects = $tw.test.fetchGraphObjects(widget).edges;
		expect(edgeObjects).toBeUndefined();
	});

	it("renders nothing with blank field", function() {
		wiki.addTiddler({title: "EmptyField", field: ""});
		var widget = renderAction("<$each.typed $field=field $tiddler=EmptyField />");
		var edgeObjects = $tw.test.fetchGraphObjects(widget).edges;
		expect(edgeObjects).toBeUndefined();
	});

	it("default uses currentTiddler", function() {
		var widget = $tw.test.renderGlobal(wiki, "\\define currentTiddler() Target\n<$each.typed $field=field />\n");
		expect(widget.parentDomNode.innerHTML).toBe(links(["value"]));
	});

	it("preserves currentTiddler if not assigned", function() {
		var widget = $tw.test.renderGlobal(wiki, "\\define currentTiddler() myCurrent\n<$each.typed $variable=var $tiddler=Target $field=field><<currentTiddler>>-<<var>>");
		expect(widget.parentDomNode.innerHTML).toBe("<p>myCurrent-value</p>");
	});

	it("renders with custom block fill", function() {
		var widget = $tw.test.renderGlobal(wiki, "<$each.typed $tiddler=Target $field=field>\n\n* {{!!title}}");
		expect(widget.parentDomNode.innerHTML).toBe("<ul><li>value</li></ul>");
	});

	it("renders with custom inline fill", function() {
		var widget = $tw.test.renderGlobal(wiki, "<$each.typed $tiddler=Target $field=field>\n* {{!!title}}");
		expect(widget.parentDomNode.innerHTML).toBe("<p>\n* value</p>");
	});
});

});

});
