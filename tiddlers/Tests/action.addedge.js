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

it("assumes field is a list type", function() {
	wiki.addTiddler({title: "Target", field: "A -value B"});
	var addNode = renderAction("<$action.addedge $tiddler=Target $field=field $value=value />");
	addNode.invokeActions(addNode, {});
	expect(wiki.getTiddler("Target").fields.field).toBe("A -value B value");
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

$tw.utils.each(['title', 'list', 'filter'], function(fieldType) {
	it("ignores miss removals for " + fieldType, function() {
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
});

/*** Edge rendering ***/

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

});
