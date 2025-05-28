/*\

Tests the settings pages with some basic sanity tests.

\*/

describe('Settings', function() {

var wiki, modal, oldModal;

/*
beforeEach(async function() {
	wiki = new $tw.Wiki();
	await $tw.test.setGlobals(wiki);
});
*/

it("renders data tiddlers using viewTemplate", function() {
	var widget = $tw.test.renderText($tw.wiki, "{{$:/config/flibbles/graph/edges/formulas/links||$:/core/ui/ViewTemplate/body}}");
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
	var widget = $tw.test.renderGlobal($tw.wiki, "{{$:/plugins/flibbles/graph/ui/Settings/Properties|edges}}");
	var html = widget.parentDomNode.innerHTML;
	// Make sure we're getting those default object type categories
	expect(html).toContain("Formulas");
	// Make sure we're finding the types within the categories too
	expect(html).toContain(">links<");
});

});
