/*\

Tests the graphnodes[] filter operator

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
	var result = wiki.filterTiddlers("[[$:/graph/TestGraph]graphnodes[]]");
	expect(result).toEqual(["NodeA", "NodeB", "NodeC"]);
});

it("returns empty array when input is empty", function() {
	var result = wiki.filterTiddlers("[tag[nonexistent]graphnodes[]]");
	expect(result).toEqual([]);
});

it("returns empty array when graph has no filter field", function() {
	wiki.addTiddlers([
		{title: "$:/graph/EmptyGraph", type: "application/json", text: '{}'}
	]);
	var result = wiki.filterTiddlers("[[$:/graph/EmptyGraph]graphnodes[]]");
	expect(result).toEqual([]);
});

it("works with CJK graph names", function() {
	wiki.addTiddlers([
		{title: "$:/graph/普通模式意义之塔", filter: "了解迷宫环境 地下城探索 漫画剧情引入", type: "application/json", text: '{}'}
	]);
	var result = wiki.filterTiddlers("[[$:/graph/普通模式意义之塔]graphnodes[]]");
	expect(result).toEqual(["了解迷宫环境", "地下城探索", "漫画剧情引入"]);
});

it("handles titles with spaces using quotes", function() {
	wiki.addTiddlers([
		{title: "$:/graph/TestGraph", filter: "[[Title With Spaces]] NormalTitle [[Another Spaced Title]]", type: "application/json", text: '{}'}
	]);
	var result = wiki.filterTiddlers("[[$:/graph/TestGraph]graphnodes[]]");
	expect(result).toEqual(["Title With Spaces", "NormalTitle", "Another Spaced Title"]);
});

it("supports complex filter expressions", function() {
	wiki.addTiddlers([
		{title: "NodeA", tags: "node"},
		{title: "NodeB", tags: "node"},
		{title: "NodeC", tags: "other"},
		{title: "$:/graph/FilterGraph", filter: "[tag[node]]", type: "application/json", text: '{}'}
	]);
	var result = wiki.filterTiddlers("[[$:/graph/FilterGraph]graphnodes[]]");
	expect(result.sort()).toEqual(["NodeA", "NodeB"]);
});

it("supports filter with negation", function() {
	wiki.addTiddlers([
		{title: "NodeA", tags: "node"},
		{title: "NodeB", tags: "node"},
		{title: "NodeC", tags: "node system"},
		{title: "$:/graph/FilterGraph", filter: "[tag[node]!tag[system]]", type: "application/json", text: '{}'}
	]);
	var result = wiki.filterTiddlers("[[$:/graph/FilterGraph]graphnodes[]]");
	expect(result.sort()).toEqual(["NodeA", "NodeB"]);
});

it("supports filter with variables", function() {
	wiki.addTiddlers([
		{title: "NodeA"},
		{title: "NodeB"},
		{title: "NodeC"},
		{title: "$:/graph/ListGraph", filter: "NodeA NodeB NodeC", type: "application/json", text: '{}'}
	]);
	var result = wiki.filterTiddlers("[[$:/graph/ListGraph]graphnodes[]]");
	expect(result).toEqual(["NodeA", "NodeB", "NodeC"]);
});

it("can process multiple graphs", function() {
	wiki.addTiddlers([
		{title: "$:/graph/GraphA", filter: "NodeA NodeB", type: "application/json"},
		{title: "$:/graph/GraphB", filter: "NodeC NodeD", type: "application/json"}
	]);
	var result = wiki.filterTiddlers("[[$:/graph/GraphA]] [[$:/graph/GraphB]] +[graphnodes[]]");
	expect(result.sort()).toEqual(["NodeA", "NodeB", "NodeC", "NodeD"]);
});

it("deduplicates nodes from multiple graphs", function() {
	wiki.addTiddlers([
		{title: "$:/graph/GraphA", filter: "NodeA NodeB", type: "application/json"},
		{title: "$:/graph/GraphB", filter: "NodeB NodeC", type: "application/json"}
	]);
	var result = wiki.filterTiddlers("[[$:/graph/GraphA]] [[$:/graph/GraphB]] +[graphnodes[]]");
	expect(result.sort()).toEqual(["NodeA", "NodeB", "NodeC"]);
});

it("works with prefix filter to get all graphs", function() {
	wiki.addTiddlers([
		{title: "$:/graph/GraphA", filter: "NodeA", type: "application/json"},
		{title: "$:/graph/GraphB", filter: "NodeB", type: "application/json"},
		{title: "$:/other/NotAGraph", filter: "NodeC", type: "application/json"}
	]);
	var result = wiki.filterTiddlers("[prefix[$:/graph/]graphnodes[]]");
	expect(result.sort()).toEqual(["NodeA", "NodeB"]);
});

});
