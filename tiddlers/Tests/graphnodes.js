/*\

Tests the [graphnodes[]] filter operator

\*/

describe('graphnodes filter', function() {

var wiki;

beforeEach(function() {
	wiki = new $tw.Wiki();
});

it("returns nodes from a graph's filter field", function() {
	wiki.addTiddlers([
		{title: "$:/graph/TestGraph", filter: "NodeA NodeB NodeC", type: "application/json", text: '{"NodeA": "0,0", "NodeB": "100,100"}'}
	]);
	var result = wiki.filterTiddlers("[graphnodes[$:/graph/TestGraph]]");
	expect(result).toEqual(["NodeA", "NodeB", "NodeC"]);
});

it("returns empty array when graph doesn't exist", function() {
	var result = wiki.filterTiddlers("[graphnodes[$:/graph/NonExistent]]");
	expect(result).toEqual([]);
});

it("returns empty array when filter field is blank", function() {
	wiki.addTiddlers([
		{title: "$:/graph/EmptyGraph", type: "application/json", text: '{}'}
	]);
	var result = wiki.filterTiddlers("[graphnodes[$:/graph/EmptyGraph]]");
	expect(result).toEqual([]);
});

it("returns empty array when no operand is provided", function() {
	var result = wiki.filterTiddlers("[graphnodes[]]");
	expect(result).toEqual([]);
});

it("works with CJK graph names", function() {
	wiki.addTiddlers([
		{title: "$:/graph/普通模式意义之塔", filter: "了解迷宫环境 地下城探索 漫画剧情引入", type: "application/json", text: '{}'}
	]);
	var result = wiki.filterTiddlers("[graphnodes[$:/graph/普通模式意义之塔]]");
	expect(result).toEqual(["了解迷宫环境", "地下城探索", "漫画剧情引入"]);
});

it("handles titles with spaces using quotes", function() {
	wiki.addTiddlers([
		{title: "$:/graph/TestGraph", filter: "[[Title With Spaces]] NormalTitle [[Another Spaced Title]]", type: "application/json", text: '{}'}
	]);
	var result = wiki.filterTiddlers("[graphnodes[$:/graph/TestGraph]]");
	expect(result).toEqual(["Title With Spaces", "NormalTitle", "Another Spaced Title"]);
});

it("supports complex filter expressions", function() {
	wiki.addTiddlers([
		{title: "NodeA", tags: "node"},
		{title: "NodeB", tags: "node"},
		{title: "NodeC", tags: "other"},
		{title: "$:/graph/FilterGraph", filter: "[tag[node]]", type: "application/json", text: '{}'}
	]);
	var result = wiki.filterTiddlers("[graphnodes[$:/graph/FilterGraph]]");
	expect(result.sort()).toEqual(["NodeA", "NodeB"]);
});

it("supports filter with negation", function() {
	wiki.addTiddlers([
		{title: "NodeA", tags: "node"},
		{title: "NodeB", tags: "node"},
		{title: "NodeC", tags: "node system"},
		{title: "$:/graph/FilterGraph", filter: "[tag[node]!tag[system]]", type: "application/json", text: '{}'}
	]);
	var result = wiki.filterTiddlers("[graphnodes[$:/graph/FilterGraph]]");
	expect(result.sort()).toEqual(["NodeA", "NodeB"]);
});

it("supports filter with variables", function() {
	wiki.addTiddlers([
		{title: "NodeA"},
		{title: "NodeB"},
		{title: "NodeC"},
		{title: "$:/graph/ListGraph", filter: "NodeA NodeB NodeC", type: "application/json", text: '{}'}
	]);
	var result = wiki.filterTiddlers("[graphnodes[$:/graph/ListGraph]]");
	expect(result).toEqual(["NodeA", "NodeB", "NodeC"]);
});

});
