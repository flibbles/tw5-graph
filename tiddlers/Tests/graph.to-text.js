/*\

Tests the graph.to-text macro.

\*/

describe('graph.to-text macro', function() {

var wiki, toTextMacro;

beforeEach(function() {
	wiki = new $tw.Wiki();
	wiki.addTiddler($tw.wiki.getTiddler("$:/core/config/GlobalImportFilter").fields);
	
	// Add global edge configuration
	wiki.addTiddler({
		title: "$:/plugins/flibbles/graph/subfilters",
		type: "application/x-tiddler-dictionary",
		text: "edgetypes.fields: :cache[all[shadows+tiddlers]removeprefix[$:/config/flibbles/graph/edges/fields/]]"
	});
	
	// Get the macro module from TW's module system
	var macros = $tw.modules.getModulesByTypeAsHashmap("macro");
	toTextMacro = macros["graph.to-text"];
});

function toText(tiddler) {
	// Create a mock context for the macro
	var context = {
		wiki: wiki,
		getVariable: function(name) {
			if (name === "currentTiddler") return "";
			return "";
		}
	};

	return toTextMacro.run.call(context, tiddler);
}

// Normalize macro output for assertions
function normalize(out) {
    // Strip <pre> wrappers if present and decode our arrow entity to -->
    return (out || "")
        .replace(/<pre>/g, "")
        .replace(/<\/pre>/g, "")
        .replace(/&#45;&#45;>/g, "-->");
}

it("returns error if graph tiddler not found", function() {
	var result = normalize(toText("$:/graph/NonExistent"));
	expect(result).toContain("Error");
	expect(result).toContain("not found");
});

it("returns error if graph has no filter", function() {
	wiki.addTiddler({title: "$:/graph/Test"});
	var result = normalize(toText("$:/graph/Test"));
	expect(result).toContain("Error");
	expect(result).toContain("no filter field");
});

it("returns warning if filter produces no nodes", function() {
	wiki.addTiddler({
		title: "$:/graph/Test",
		filter: "[tag[NonExistent]]"
	});
	var result = normalize(toText("$:/graph/Test"));
	expect(result).toContain("Warning");
	expect(result).toContain("No nodes found");
});

it("generates basic mermaid graph with nodes", function() {
	// Create some test tiddlers
	wiki.addTiddler({title: "NodeA", tags: []});
	wiki.addTiddler({title: "NodeB", tags: []});
	wiki.addTiddler({title: "NodeC", tags: []});
	
	wiki.addTiddler({
		title: "$:/graph/Test",
		filter: "NodeA NodeB NodeC"
	});
	
	var result = normalize(toText("$:/graph/Test"));
	
	expect(result).toContain("graph TD");
	expect(result).toContain("NodeA");
	expect(result).toContain("NodeB");
	expect(result).toContain("NodeC");
});

it("generates edges based on tags field by default", function() {
	wiki.addTiddler({title: "Parent", tags: []});
	wiki.addTiddler({title: "Child", tags: ["Parent"]});
	
	wiki.addTiddler({
		title: "$:/graph/Test",
		filter: "Parent Child"
	});
	
	var result = normalize(toText("$:/graph/Test"));
	
	expect(result).toContain("graph TD");
	expect(result).toMatch(/-->/);
	// Child should point to Parent via tags
	expect(result).toMatch(/Child.*-->.*Parent/s);
});

it("generates edges based on custom edge fields", function() {
	wiki.addTiddler({title: "A", customfield: "B"});
	wiki.addTiddler({title: "B", customfield: "C"});
	wiki.addTiddler({title: "C"});
	
	wiki.addTiddler({
		title: "$:/graph/Test",
		filter: "A B C",
		"edges.fields": "customfield"
	});
	
	var result = normalize(toText("$:/graph/Test"));
	
	expect(result).toContain("graph TD");
	expect(result).toMatch(/A\s*-->(?:\|[^|]+\|\s*)?B/);
	expect(result).toMatch(/B\s*-->(?:\|[^|]+\|\s*)?C/);
});

it("handles multiple edge fields", function() {
	wiki.addTiddler({title: "Node1", tags: ["Node2"], links: "Node3"});
	wiki.addTiddler({title: "Node2"});
	wiki.addTiddler({title: "Node3"});
	
	wiki.addTiddler({
		title: "$:/graph/Test",
		filter: "Node1 Node2 Node3",
		"edges.fields": "tags links"
	});
	
	var result = normalize(toText("$:/graph/Test"));
	
	expect(result).toContain("graph TD");
	// Should have edges from Node1 to both Node2 and Node3
	expect(result).toMatch(/Node1.*-->.*Node2/s);
	expect(result).toMatch(/Node1.*-->.*Node3/s);
});

it("sanitizes special characters in node names", function() {
	wiki.addTiddler({title: "Node-With-Dashes", tags: []});
	wiki.addTiddler({title: "Node With Spaces", tags: []});
	wiki.addTiddler({title: "$System/Node", tags: []});
	
	wiki.addTiddler({
		title: "$:/graph/Test",
		filter: "[[Node-With-Dashes]] [[Node With Spaces]] [[$System/Node]]"
	});
	
	var result = normalize(toText("$:/graph/Test"));
	
	// IDs should be sanitized but labels should show original names
	expect(result).toContain("graph TD");
	expect(result).toContain("Node-With-Dashes");
	expect(result).toContain("Node With Spaces");
	expect(result).toContain("$System/Node");
});

it("avoids duplicate edges", function() {
	wiki.addTiddler({title: "A", tags: ["B"], customfield: "B"});
	wiki.addTiddler({title: "B"});
	
	wiki.addTiddler({
		title: "$:/graph/Test",
		filter: "A B",
		"edges.fields": "tags customfield"
	});
	
	var result = normalize(toMermaid("$:/graph/Test"));
	
	// Count the number of A --> B edges (should be only 1)
	var edgeMatches = result.match(/A\s*-->(?:\|[^|]+\|\s*)?B/g);
	expect(edgeMatches).toBeTruthy();
	expect(edgeMatches.length).toBe(1);
});

it("ignores edges to nodes not in the filter", function() {
	wiki.addTiddler({title: "A", tags: ["B", "External"]});
	wiki.addTiddler({title: "B"});
	wiki.addTiddler({title: "External"});
	
	wiki.addTiddler({
		title: "$:/graph/Test",
		filter: "A B"  // External is not included
	});
	
	var result = normalize(toMermaid("$:/graph/Test"));
	
	// Should have edge to B but not to External
	expect(result).toMatch(/A\s*-->(?:\|[^|]+\|\s*)?B/);
	expect(result).not.toContain("External");
});

it("handles Chinese characters in node names", function() {
	wiki.addTiddler({title: "地下城探索", tags: []});
	wiki.addTiddler({title: "增强生存能力", tags: ["地下城探索"]});
	
	wiki.addTiddler({
		title: "$:/graph/Test",
		filter: "地下城探索 增强生存能力"
	});
	
	var result = normalize(toMermaid("$:/graph/Test"));
	
	expect(result).toContain("graph TD");
	expect(result).toContain("地下城探索");
	expect(result).toContain("增强生存能力");
	expect(result).toContain("-->");
});

it("uses default graph if no tiddler specified", function() {
	wiki.addTiddler({title: "A", tags: []});
	wiki.addTiddler({
		title: "$:/graph/Default",
		filter: "A"
	});
	
	var context = {
		wiki: wiki,
		getVariable: function(name) {
			if (name === "currentTiddler") return "";
			return "";
		}
	};
	
	// Call without tiddler parameter to use default
	var result = normalize(toTextMacro.run.call(context));
	
	expect(result).toContain("graph TD");
	expect(result).toContain("A");
});

it("handles node ID collisions by appending hash", function() {
	wiki.addTiddlers([
		{title: "Node-A"},
		{title: "Node.A"},
		{title: "Node_A"}
	]);
	wiki.addTiddler({
		title: "$:/graph/Test",
		filter: "Node-A [[Node.A]] [[Node_A]]"
	});
	
	var result = normalize(toMermaid("$:/graph/Test"));
	
	expect(result).toContain("graph TD");
	// All three nodes should appear with different IDs
	var nodeIdMatches = result.match(/Node_A[^\s\["]*/g);
	expect(nodeIdMatches).toBeTruthy();
	// Should have at least 3 unique node IDs (original + hash suffixes)
	var uniqueIds = new Set(nodeIdMatches);
	expect(uniqueIds.size).toBeGreaterThanOrEqual(3);
});

it("returns error for invalid filter syntax", function() {
	wiki.addTiddler({
		title: "$:/graph/Test",
		filter: "[tag[invalid"  // Missing closing bracket
	});
	
	var result = normalize(toMermaid("$:/graph/Test"));
	
	// TiddlyWiki filter errors may create special error nodes
	// Check that either an error message appears or the graph handles it gracefully
	expect(result).toContain("graph TD");
	// Filter errors in TW typically result in Filter_error nodes or empty results
	var hasFilterError = result.includes("Filter_error") || result.includes("Filter error");
	var hasNoNodes = !result.match(/\[\"/); // No nodes with labels
	expect(hasFilterError || hasNoNodes).toBe(true);
});

});
