/*\

Tests the action.addedge global widget.

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

it("assumes undefined field type is a list", function() {
	wiki.addTiddler({title: "Target", field: "A -value B"});
	var addNode = renderAction("<$action.addedge $tiddler=Target $field=field $value=value />");
	addNode.invokeActions(addNode, {});
	expect(wiki.getTiddler("Target").fields.field).toBe("A -value B value");
	wiki.addTiddler({title: "Target", field: "A value 'value' B"});
	var removeNode = renderAction("<$action.removeedge $tiddler=Target $field=field $value=value />");
	removeNode.invokeActions(removeNode, {});
	expect(wiki.getTiddler("Target").fields.field).toBe("A 'value' B");
});

it("takes no action with unknown field type", function() {
	wiki.addTiddler({title: "Target", field: "A B"});
	wiki.addTiddler(relinkConfig("bizarre"));
	var addNode = renderAction("<$action.addedge $tiddler=Target $field=field $value=value />");
	addNode.invokeActions(addNode, {});
	expect(wiki.getTiddler("Target").fields.field).toBe("A B");
	wiki.addTiddler({title: "Target", field: "value"});
	var removeNode = renderAction("<$action.removeedge $tiddler=Target $field=field $value=value />");
	removeNode.invokeActions(removeNode, {});
	expect(wiki.getTiddler("Target").fields.field).toBe("value");
});

it("can set explicit list fields", function() {
	wiki.addTiddler({title: "Target", field: "A B"});
	wiki.addTiddler(relinkConfig("list"));
	var addNode = renderAction("<$action.addedge $tiddler=Target $field=field $value='this value' />");
	addNode.invokeActions(addNode, {});
	expect(wiki.getTiddler("Target").fields.field).toBe("A B [[this value]]");
	var removeNode = renderAction("<$action.removeedge $tiddler=Target $field=field $value='this value' />");
	removeNode.invokeActions(removeNode, {});
	expect(wiki.getTiddler("Target").fields.field).toBe("A B");
});

it("can set title fields", function() {
	wiki.addTiddler({title: "Target", field: "else"});
	wiki.addTiddler(relinkConfig("title"));
	var addNode = renderAction("<$action.addedge $tiddler=Target $field=field $value='this value' />");
	addNode.invokeActions(addNode, {});
	expect(wiki.getTiddler("Target").fields.field).toBe("this value");
	var removeNode = renderAction("<$action.removeedge $tiddler=Target $field=field $value='this value' />");
	removeNode.invokeActions(removeNode, {});
	expect(wiki.getTiddler("Target").fields.field).toBeUndefined();
});

it("can set filter fields", function() {
	wiki.addTiddler({title: "this value"});
	wiki.addTiddler({title: "Target", field: "[all[]] -[[this value]]"});
	wiki.addTiddler(relinkConfig("filter"));
	var addNode = renderAction("<$action.addedge $tiddler=Target $field=field $value='this value' />");
	addNode.invokeActions(addNode, {});
	expect(wiki.getTiddler("Target").fields.field).toBe("[all[]]");
	var removeNode = renderAction("<$action.removeedge $tiddler=Target $field=field $value='this value' />");
	removeNode.invokeActions(removeNode, {});
	expect(wiki.getTiddler("Target").fields.field).toBe("[all[]] -[[this value]]");
});

/*** Edge rendering ***/

it("renders list edges as default", function() {
	wiki.addTiddler({title: "Target", field: "this -value"});
	var widget = renderAction("\\define currentTiddler() Target\n<$edges.field $field=field />");
	var edgeObjects = $tw.test.fetchGraphObjects(widget).edges;
	expect(Object.values(edgeObjects)).toEqual([
		{from: "Target", to: "this"},
		{from: "Target", to: "-value"}]);
});

it("renders nothing for unknown edge types", function() {
	wiki.addTiddler(relinkConfig("bizarre"));
	wiki.addTiddler({title: "Target", field: "value"});
	var widget = renderAction("\\define currentTiddler() Target\n<$edges.field $field=field />");
	var edgeObjects = $tw.test.fetchGraphObjects(widget).edges;
	expect(edgeObjects).toBeUndefined();
});

it("can render title edges", function() {
	wiki.addTiddler(relinkConfig("title"));
	wiki.addTiddler({title: "Target", field: "this value"});
	var widget = renderAction("\\define currentTiddler() Target\n<$edges.field $field=field />");
	var edgeObjects = $tw.test.fetchGraphObjects(widget).edges;
	expect(Object.values(edgeObjects)).toEqual([{from: "Target", to: "this value"}]);
});

it("can render list edges", function() {
	wiki.addTiddler(relinkConfig("list"));
	wiki.addTiddler({title: "Target", field: "this -value"});
	var widget = renderAction("\\define currentTiddler() Target\n<$edges.field $field=field />");
	var edgeObjects = $tw.test.fetchGraphObjects(widget).edges;
	expect(Object.values(edgeObjects)).toEqual([
		{from: "Target", to: "this"},
		{from: "Target", to: "-value"}]);
});

it("can render filter edges", function() {
	wiki.addTiddler(relinkConfig("filter"));
	wiki.addTiddler({title: "Target", field: "A B [[this]addsuffix[ value]]"});
	var widget = renderAction("\\define currentTiddler() Target\n<$edges.field $field=field />");
	var edgeObjects = $tw.test.fetchGraphObjects(widget).edges;
	expect(Object.values(edgeObjects)).toEqual([
		{from: "Target", to: "A"},
		{from: "Target", to: "B"},
		{from: "Target", to: "this value"}]);
});

/*** Standard behavior between all edgetypes ***/

$tw.utils.each($tw.wiki.filterTiddlers("[all[tiddlers+shadows]removeprefix[$:/plugins/flibbles/graph/edgetypes/]]"), function(fieldType) {

	it("ignores missed removals for " + fieldType, function() {
		wiki.addTiddler({title: "Target", field: "value"});
		wiki.addTiddler(relinkConfig(fieldType));
		var remove = renderAction("<$action.removeedge $tiddler=Target $field=field $value=else />");
		remove.invokeActions(remove, {});
		var tiddler = wiki.getTiddler("Target");
		expect(tiddler.fields.field).toBe("value");
		expect(tiddler.fields.modified).toBeUndefined();
	});

	it("clears the field when emptied for " + fieldType, function() {
		wiki.addTiddler({title: "Target", field: "value"});
		wiki.addTiddler(relinkConfig(fieldType));
		var remove = renderAction("<$action.removeedge $tiddler=Target $field=field $value=value />");
		remove.invokeActions(remove, {});
		var tiddler = wiki.getTiddler("Target");
		expect(tiddler.fields.field).toBeUndefined();
	});

	it("renders nothing with missing tiddler for " + fieldType, function() {
		wiki.addTiddler(relinkConfig(fieldType));
		var widget = renderAction("<$edges.field $field=field $tiddler=Target />");
		var edgeObjects = $tw.test.fetchGraphObjects(widget).edges;
		expect(edgeObjects).toBeUndefined();
	});

	it("renders nothing with missing field for " + fieldType, function() {
		wiki.addTiddler(relinkConfig(fieldType));
		wiki.addTiddler({title: "Target"});
		var widget = renderAction("<$edges.field $field=field $tiddler=Target />");
		var edgeObjects = $tw.test.fetchGraphObjects(widget).edges;
		expect(edgeObjects).toBeUndefined();
	});

	it("renders nothing with blank field for " + fieldType, function() {
		wiki.addTiddler(relinkConfig(fieldType));
		wiki.addTiddler({title: "Target", field: ""});
		var widget = renderAction("<$edges.field $field=field $tiddler=Target />");
		var edgeObjects = $tw.test.fetchGraphObjects(widget).edges;
		expect(edgeObjects).toBeUndefined();
	});

	it("renders with from as currentTiddler for " + fieldType, function() {
		wiki.addTiddler(relinkConfig(fieldType));
		wiki.addTiddler({title: "Target", field: "goodTo"});
		wiki.addTiddler({title: "Template", field: "badTo"});
		var widget = renderAction("\\define currentTiddler() Template\n<$edges.field $field=field $tiddler=Target />");
		var edgeObjects = $tw.test.fetchGraphObjects(widget).edges;
		expect(Object.values(edgeObjects)).toEqual([
			{from: "Template", to: "goodTo"}]);
	});

	it("renders with custom fill for " + fieldType, function() {
		wiki.addTiddler(relinkConfig(fieldType));
		wiki.addTiddler({title: "Target", field: "to"});
		var widget = renderAction("\\define currentTiddler() Target\n<$edges.field $field=field>\n\n<$edge value=test $to=<<toTiddler>> />\n");
		var edgeObjects = $tw.test.fetchGraphObjects(widget).edges;
		expect(Object.values(edgeObjects)).toEqual([
			{from: "Target", to: "to", value: "test"}]);
	});
});

});
