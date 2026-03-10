/*\

Tests the settings pages with some basic sanity tests.

\*/

describe('Settings', function() {

var wiki, modal, oldModal;

beforeEach(async function() {
	wiki = new $tw.Wiki();
	$tw.test.setSpies();
	await $tw.test.setGlobals(wiki);
});

it("renders data tiddlers using viewTemplate", function() {
	var widget = $tw.test.renderText(wiki, "{{$:/config/flibbles/graph/edges/functions/links||$:/core/ui/ViewTemplate/body}}");
	var html = widget.parentDomNode.innerHTML;
	// Make sure the table renders
	expect(html).toContain("<table");
	// Make sure we're getting the properties of the underlying dataTiddler
	expect(html).toContain("links to");
	// Make sure we're loading the proper input fields
	expect(html).toContain('type="color"');
	// Make sure we're loading the right kind of CSS classes
	expect(html).toContain("input-color");
	// Make sure the category-specific stuff loads
	expect(html).toContain("Filter:");
});

it("renders Properties tab", function() {
	// Tests that the Properties tab in settings can find and load all edge types along side-tab list
	var widget = $tw.test.renderGlobal(wiki, "{{$:/plugins/flibbles/graph/ui/Settings/Properties|edges}}");
	var html = widget.parentDomNode.innerHTML;
	// Make sure we're getting those default object type categories
	expect(html).toContain("Functions");
	// Make sure we're finding the types within the categories too
	expect(html).toContain(">links<");
});

/*** GraphTiddler EditTemplate ***/

// Pulling this bit out into a variable of its own so I can make sure the
// following tests consistently look for the same string's presence or absence.
var notInstalled = "(not installed!)";

it("can display engine options when no engine selected", function() {
	wiki.addTiddler({title: "Target"});
	var widget = $tw.test.renderGlobal(wiki, "{{Target||$:/plugins/flibbles/graph/ui/Settings/Graphs/EditTemplate}}");
	var html = widget.parentDomNode.innerHTML;
	// It contains the dropdown.
	expect(html).toContain("Engine: <select");
	// that dropdown contains the test module
	expect(html).toContain("<option>Test");
	// The "not installed" warning does not show up
	expect(html).not.toContain(notInstalled);
});

it("can display engine options when no engine selected", function() {
	wiki.addTiddler({title: "Target", engine: "Nonexistent"});
	var widget = $tw.test.renderGlobal(wiki, "{{Target||$:/plugins/flibbles/graph/ui/Settings/Graphs/EditTemplate}}");
	var html = widget.parentDomNode.innerHTML;
	// It contains the dropdown.
	expect(html).toContain("Engine: <select");
	// that dropdown contains the test module
	expect(html).toContain(`Nonexistent ${notInstalled}</option>`);
});

/*** Edgetype settings ***/

it("property sets classes on edgelists", function() {
	wiki.addTiddler({title: "Target",
		"edges.fields": "[all[]] -tags",
		"edges.functions": "[all[]] -links"});
	var widget = $tw.test.renderGlobal(wiki, "{{Target||$:/plugins/flibbles/graph/ui/EditTemplate/Edges}}");
	var html = widget.parentDomNode.innerHTML;
	expect(html).toContain('class="inactive">tags<');
	expect(html).toContain('class="active">list<');
	expect(html).toContain('class="inactive">links<');
	expect(html).toContain('class="active">transcludes<');
});

it("allows for custom field edges, but not custom function edges", function() {
	wiki.addTiddler({title: "Target",
		"edges.fields": "[all[]] customField",
		"edges.functions": "[all[]] customFunction"});
	var widget = $tw.test.renderGlobal(wiki, "{{Target||$:/plugins/flibbles/graph/ui/EditTemplate/Edges}}");
	// A usual suspects
	expect(widget.parentDomNode.innerHTML).toContain(">tags<");
	expect(widget.parentDomNode.innerHTML).toContain(">transcludes<");
	// A custom written one
	expect(widget.parentDomNode.innerHTML).toContain(">customField<");
	expect(widget.parentDomNode.innerHTML).not.toContain(">customFunction<");
});

/*** GraphTiddler settings and view template***/

it("renders the graphtiddler viewtemplate without fluff", function() {
	wiki.addTiddler({title: "$:/graph/Test"});
	var widget = $tw.test.renderGlobal(wiki, "{{$:/graph/Test||$:/core/ui/ViewTemplate/body}}")
	var html = widget.parentDomNode.innerHTML;
	expect(html).toContain("graph-canvas");
	// "issing" as in "Missing Tiddler". That was popping up at one point,
	// and it shouldn't.
	expect(html).not.toContain("issing");
});

it("renders the global graphtiddler if no engine field specified", function() {
	wiki.addTiddlers([
		{title: "$:/graph/Test", template: "Template"},
		{title: "Template", text: "<<graphengine>>"}]);
	var widget = $tw.test.renderGlobal(wiki, "{{$:/graph/Test||$:/core/ui/ViewTemplate/body}}")
	var html = widget.parentDomNode.innerHTML;
	// "Test" is the engine used as the global in renderGlobal
	expect(html).toContain("Test");
});

it("renders the graphtiddler with field-specified engine", function() {
	wiki.addTiddlers([
		{title: "$:/graph/Test", engine: "Fielded", template: "Template"},
		{title: "Template", text: "<<graphengine>>"}]);
	var widget = $tw.test.renderGlobal(wiki, "{{$:/graph/Test||$:/core/ui/ViewTemplate/body}}")
	var html = widget.parentDomNode.innerHTML;
	expect(html).toContain("Fielded");
});

});
