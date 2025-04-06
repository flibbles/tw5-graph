/*\

Tests the following suite of macro widgets:

$action.addtyped
$action.removetyped
$each.typed

\*/

describe('ActionAddEdge \\widget', function() {

var wiki;

// TODO: Need more tests regarding the $variable attribute

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

it("assumes undefined field type is a list", function() {
	wiki.addTiddler({title: "Target", field: "A -value B"});
	var addNode = renderAction("<$action.addtyped $tiddler=Target $field=field $value=value />");
	addNode.invokeActions(addNode, {});
	expect(wiki.getTiddler("Target").fields.field).toBe("A -value B value");
	wiki.addTiddler({title: "Target", field: "A value 'value' B"});
	var removeNode = renderAction("<$action.removetyped $tiddler=Target $field=field $value=value />");
	removeNode.invokeActions(removeNode, {});
	expect(wiki.getTiddler("Target").fields.field).toBe("A 'value' B");
});

it("takes no action with unknown field type", function() {
	wiki.addTiddler({title: "Target", field: "A B"});
	wiki.addTiddler(relinkConfig("bizarre"));
	var addNode = renderAction("<$action.addtyped $tiddler=Target $field=field $value=value />");
	addNode.invokeActions(addNode, {});
	expect(wiki.getTiddler("Target").fields.field).toBe("A B");
	wiki.addTiddler({title: "Target", field: "value"});
	var removeNode = renderAction("<$action.removetyped $tiddler=Target $field=field $value=value />");
	removeNode.invokeActions(removeNode, {});
	expect(wiki.getTiddler("Target").fields.field).toBe("value");
});

it("can set explicit list fields", function() {
	wiki.addTiddler({title: "Target", field: "A B"});
	wiki.addTiddler(relinkConfig("list"));
	var addNode = renderAction("<$action.addtyped $tiddler=Target $field=field $value='this value' />");
	addNode.invokeActions(addNode, {});
	expect(wiki.getTiddler("Target").fields.field).toBe("A B [[this value]]");
	var removeNode = renderAction("<$action.removetyped $tiddler=Target $field=field $value='this value' />");
	removeNode.invokeActions(removeNode, {});
	expect(wiki.getTiddler("Target").fields.field).toBe("A B");
});

it("can set title fields", function() {
	wiki.addTiddler({title: "Target", field: "else"});
	wiki.addTiddler(relinkConfig("title"));
	var addNode = renderAction("<$action.addtyped $tiddler=Target $field=field $value='this value' />");
	addNode.invokeActions(addNode, {});
	expect(wiki.getTiddler("Target").fields.field).toBe("this value");
	var removeNode = renderAction("<$action.removetyped $tiddler=Target $field=field $value='this value' />");
	removeNode.invokeActions(removeNode, {});
	expect(wiki.getTiddler("Target").fields.field).toBeUndefined();
});

it("can set filter fields", function() {
	wiki.addTiddler({title: "this value"});
	wiki.addTiddler({title: "Target", field: "[all[]] -[[this value]]"});
	wiki.addTiddler(relinkConfig("filter"));
	var addNode = renderAction("<$action.addtyped $tiddler=Target $field=field $value='this value' />");
	addNode.invokeActions(addNode, {});
	expect(wiki.getTiddler("Target").fields.field).toBe("[all[]]");
	var removeNode = renderAction("<$action.removetyped $tiddler=Target $field=field $value='this value' />");
	removeNode.invokeActions(removeNode, {});
	expect(wiki.getTiddler("Target").fields.field).toBe("[all[]] -[[this value]]");
});

/*** Field iterating ***/

it("renders list edges as default", function() {
	wiki.addTiddler({title: "Target", field: "this -value"});
	var widget = $tw.test.renderGlobal(wiki, "<$each.typed $tiddler=Target $field=field />\n");
	expect(widget.parentDomNode.innerHTML).toBe(links(["this", "-value"]));
});

it("renders nothing for unknown edge types", function() {
	wiki.addTiddler(relinkConfig("bizarre"));
	wiki.addTiddler({title: "Target", field: "value"});
	var widget = $tw.test.renderGlobal(wiki, "<$each.typed $tiddler=Target $field=field />\n");
	expect(widget.parentDomNode.innerHTML).toBe("");
});

it("can render title edges", function() {
	wiki.addTiddler(relinkConfig("title"));
	wiki.addTiddler({title: "Target", field: "this value"});
	var widget = $tw.test.renderGlobal(wiki, "<$each.typed $tiddler=Target $field=field />\n");
	expect(widget.parentDomNode.innerHTML).toBe(links(["this value"]));
});

it("can render list edges", function() {
	wiki.addTiddler(relinkConfig("list"));
	wiki.addTiddler({title: "Target", field: "this -value"});
	var widget = $tw.test.renderGlobal(wiki, "<$each.typed $tiddler=Target $field=field />\n");
	expect(widget.parentDomNode.innerHTML).toBe(links(["this", "-value"]));
});

it("can render filter edges", function() {
	wiki.addTiddler(relinkConfig("filter"));
	// We ensure the filter treats its containing tiddler as the currentTiddler.
	wiki.addTiddler({title: "Target", store: "other", field: "A B [[this]addsuffix[ value]] [{!!store}]"});
	var widget = $tw.test.renderGlobal(wiki, "\\define currentTiddler() Target\n<$each.typed $tiddler=Target $field=field />\n");
	expect(widget.parentDomNode.innerHTML).toBe(links(["A", "B", "this value", "other"]));
});

/*** Standard behavior between all fieldtypes ***/

$tw.utils.each($tw.wiki.filterTiddlers("[all[tiddlers+shadows]removeprefix[$:/plugins/flibbles/graph/fieldtypes/]]"), function(fieldType) {

	it("ignores missed removals for " + fieldType, function() {
		wiki.addTiddler({title: "Target", field: "value"});
		wiki.addTiddler(relinkConfig(fieldType));
		var remove = renderAction("<$action.removetyped $tiddler=Target $field=field $value=else />");
		remove.invokeActions(remove, {});
		var tiddler = wiki.getTiddler("Target");
		expect(tiddler.fields.field).toBe("value");
		expect(tiddler.fields.modified).toBeUndefined();
	});

	it("clears the field when emptied for " + fieldType, function() {
		wiki.addTiddler({title: "Target", field: "value"});
		wiki.addTiddler(relinkConfig(fieldType));
		var remove = renderAction("<$action.removetyped $tiddler=Target $field=field $value=value />");
		remove.invokeActions(remove, {});
		var tiddler = wiki.getTiddler("Target");
		expect(tiddler.fields.field).toBeUndefined();
	});

	it("renders nothing with missing tiddler for " + fieldType, function() {
		wiki.addTiddler(relinkConfig(fieldType));
		var widget = renderAction("<$each.typed $field=field $tiddler=Target />");
		var edgeObjects = $tw.test.fetchGraphObjects(widget).edges;
		expect(edgeObjects).toBeUndefined();
	});

	it("renders nothing with missing field for " + fieldType, function() {
		wiki.addTiddler(relinkConfig(fieldType));
		wiki.addTiddler({title: "Target"});
		var widget = renderAction("<$each.typed $field=field $tiddler=Target />");
		var edgeObjects = $tw.test.fetchGraphObjects(widget).edges;
		expect(edgeObjects).toBeUndefined();
	});

	it("renders nothing with blank field for " + fieldType, function() {
		wiki.addTiddler(relinkConfig(fieldType));
		wiki.addTiddler({title: "Target", field: ""});
		var widget = renderAction("<$each.typed $field=field $tiddler=Target />");
		var edgeObjects = $tw.test.fetchGraphObjects(widget).edges;
		expect(edgeObjects).toBeUndefined();
	});

	it("default uses currentTiddler for " + fieldType, function() {
		wiki.addTiddler(relinkConfig(fieldType));
		wiki.addTiddler({title: "Template", field: "value"});
		var widget = $tw.test.renderGlobal(wiki, "\\define currentTiddler() Template\n<$each.typed $field=field />\n");
		expect(widget.parentDomNode.innerHTML).toBe(links(["value"]));
	});

	it("renders with custom block fill for " + fieldType, function() {
		wiki.addTiddler(relinkConfig(fieldType));
		wiki.addTiddler({title: "Target", field: "to"});
		var widget = $tw.test.renderGlobal(wiki, "<$each.typed $tiddler=Target $field=field>\n\n* {{!!title}}");
		expect(widget.parentDomNode.innerHTML).toBe("<ul><li>to</li></ul>");
	});

	it("renders with custom inline fill for " + fieldType, function() {
		wiki.addTiddler(relinkConfig("title"));
		wiki.addTiddler({title: "Target", field: "to"});
		var widget = $tw.test.renderGlobal(wiki, "<$each.typed $tiddler=Target $field=field>\n* {{!!title}}");
		expect(widget.parentDomNode.innerHTML).toBe("<p>\n* to</p>");
	});
});

});
