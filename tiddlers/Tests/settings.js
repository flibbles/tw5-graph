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
	var widget = $tw.test.renderText($tw.wiki, "{{$:/config/flibbles/graph/edges/functions/links||$:/core/ui/ViewTemplate/body}}");
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

it("renders plugin tab", function() {
	var widget = $tw.test.renderGlobal(wiki, "{{$:/plugins/flibbles/graph/ui/Settings/Properties|edges}}");
	var html = widget.parentDomNode.innerHTML;
	// Make sure we're getting those default object type categories
	expect(html).toContain("Functions");
	// Make sure we're finding the types within the categories too
	expect(html).toContain(">links<");
});

/*** Edgetype settings ***/

it("property sets classes on edgelists", function() {
	wiki.addTiddler({title: "Target",
		"edges.fields": "[all[]] -tags",
		"edges.functions": "[all[]] -links"});
	var widget = $tw.test.renderGlobal(wiki, "{{Target||$:/plugins/flibbles/graph/ui/EditTemplate/Edges}}");
	expect(widget.parentDomNode.innerHTML).toContain('class="inactive">tags<');
	expect(widget.parentDomNode.innerHTML).toContain('class="active">list<');
	expect(widget.parentDomNode.innerHTML).toContain('class="inactive">links<');
	expect(widget.parentDomNode.innerHTML).toContain('class="active">transcludes<');
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

it("Renders the GraphTiddler ViewTemplate without fluff", function() {
	wiki.addTiddler({title: "$:/graph/Test"});
	var widget = $tw.test.renderGlobal(wiki, "{{$:/graph/Test||$:/core/ui/ViewTemplate/body}}")
	var html = widget.parentDomNode.innerHTML;
	expect(html).toContain("graph-canvas");
	// "issing" as in "Missing Tiddler". That was popping up at one point,
	// and it shouldn't.
	expect(html).not.toContain("issing");
});

});
