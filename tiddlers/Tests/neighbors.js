/*\

Tests the [neighbors[]] filter operator.

\*/

describe('[neighbors[]]', function() {

var wiki;

beforeEach(function() {
	wiki = new $tw.Wiki();
});

function relinkConfig(field, type) {
	return {title: `$:/config/flibbles/relink/fields/${field}`, text: type};
};

function fieldConfig(name) {
	return {
		title: "$:/config/flibbles/graph/edges/fields/" + name,
		text: "{}", type: "application/json"};
};

function formulaConfig(name, filter) {
	return {
		title: "$:/config/flibbles/graph/edges/formulas/" + name,
		text: "{}", type: "application/json", filter: filter};
};


it("handles default call", function() {
	wiki.addTiddlers([
		relinkConfig("single", "title"),
		relinkConfig("filter", "filter"),
		fieldConfig("single"), fieldConfig("list"), fieldConfig("filter"),
		formulaConfig("links", "[links[]]"),
		{title: "Target",
			text: "This is a [[link]]",
			single: "this target",
			other: "other",
			list: "A -value B",
			filter: "C -value D" }]);
	expect(wiki.filterTiddlers("[[Target]neighbors[]sort[]]")).toEqual(["-value", "A", "B", "C", "D", "link", "this target"]);
});

});
