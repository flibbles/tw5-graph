/*\

Tests relinking in properties.

\*/

describe("Relink properties", function() {

var wiki;
var engineConfig = "$:/config/flibbles/graph/engine";

beforeEach(function() {
	wiki = new $tw.Wiki();
});

it("reports and relinks json property files", function() {
	var title = "$:/config/flibbles/graph/graph/view/myview";
	wiki.addTiddler({title: engineConfig, text: "Test"});
	wiki.addTiddler({
		title: title,
		type: "application/json",
		text: JSON.stringify({
			addNode: "[[cap|from here]]", addEdge: "{{from here}}" })});
	var report = wiki.getTiddlerRelinkReferences(title);
	expect(report).toEqual({"from here": ["addNode: [[cap]]","addEdge: {{}}"]});
	spyOn(console, "log");
	wiki.renameTiddler("from here", "to there");
	expect(wiki.getTiddlerData(title)).toEqual({
		addNode: "[[cap|to there]]", addEdge: "{{to there}}"});
});

});
