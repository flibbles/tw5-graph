/*\
Macro to convert a graph tiddler to Mermaid graph format.

Usage: <<graph.to-text "$:/graph/MyGraph">>

\*/

"use strict";

exports.name = "graph.to-text";
exports.params = [
	{name: "tiddler", default: "$:/graph/Default"}
];

/**
 * Escapes Mermaid-illegal characters in node labels
 */
function escapeLabel(text) {
	if (!text) return "";
	// Replace quotes and special characters
	return text.replace(/"/g, "&quot;").replace(/\[/g, "&#91;").replace(/\]/g, "&#93;");
}

/**
 * Sanitizes node IDs to be valid Mermaid identifiers
 */
function hashString(str) {
	// Simple FNV-1a hash for short strings
	var hash = 2166136261;
	for (var i = 0; i < str.length; i++) {
		hash ^= str.charCodeAt(i);
		hash += (hash << 1) + (hash << 4) + (hash << 7) + (hash << 8) + (hash << 24);
	}
	// Convert to unsigned and base36 for compactness
	return (hash >>> 0).toString(36);
}

function sanitizeNodeId(title, collisionMap) {
	if (!title) return "unknown";
	// Replace special characters with underscores and ensure it starts with a letter
	var id = title
	// Collision detection: if this id already used for another title, append a hash
	if (collisionMap) {
		if (collisionMap[id] && collisionMap[id] !== title) {
			id = id + "_" + hashString(title);
		}
		collisionMap[id] = title;
	}
	return id;
}

exports.run = function(tiddler) {
	// Handle default parameter
	tiddler = tiddler || "$:/graph/Default";
	
	var graphTiddler = this.wiki.getTiddler(tiddler);
	
	if (!graphTiddler) {
		return "%%Error: Graph tiddler '" + tiddler + "' not found%%";
	}
	
	// Get the filter field to determine nodes
	var filterText = graphTiddler.getFieldString("filter");
	if (!filterText) {
		return "%%Error: Graph tiddler has no filter field%%";
	}
	
	// Execute the filter to get all nodes
	var nodes;
	try {
		nodes = this.wiki.filterTiddlers(filterText);
	} catch(e) {
		return "%%Error: Failed to execute filter: " + e.message + "%%";
	}
	
	if (!nodes || nodes.length === 0) {
		return "%%Warning: No nodes found%%";
	}
	
	// Get edge field configuration
	var edgeFieldsText = graphTiddler.getFieldString("edges.fields");
	var edgeFields;
	if (edgeFieldsText) {
		// Use configured edge fields from the graph tiddler
		edgeFields = edgeFieldsText.split(/\s+/).filter(function(f) { return f; });
	} else {
		// Use default edge fields from global configuration via subfilter
		try {
			// Ask TW to evaluate the subfilter and return list of field edge names
			edgeFields = this.wiki.filterTiddlers("[subfilter{$:/plugins/flibbles/graph/subfilters##edgetypes.fields}]");
		} catch(e) {
			// Silently continue to fallback
		}
		// If still no edge fields, use tags as ultimate fallback
		if (!edgeFields || edgeFields.length === 0) {
			edgeFields = ["tags"];
		}
	}
	
	// Build Mermaid graph
	var output = ["graph TD"];
	
	// Create a mapping of titles to sanitized IDs, with collision detection
	var nodeIdMap = {};
	var idCollisionMap = {};
	nodes.forEach(function(nodeTitle) {
		nodeIdMap[nodeTitle] = sanitizeNodeId(nodeTitle, idCollisionMap);
	});
	
	// Add nodes with labels
	nodes.forEach(function(nodeTitle) {
		var nodeId = nodeIdMap[nodeTitle];
		var label = escapeLabel(nodeTitle);
		output.push("    " + nodeId + "[\"" + label + "\"]");
	});
	
	// Track edges to avoid duplicates
	var edgeSet = new Set();
	
	// Add edges based on edge fields
	nodes.forEach(function(nodeTitle) {
		var nodeTiddler = this.wiki.getTiddler(nodeTitle);
		if (!nodeTiddler) return;
		
		var sourceId = nodeIdMap[nodeTitle];
		
		edgeFields.forEach(function(fieldName) {
			var fieldValue = nodeTiddler.getFieldString(fieldName);
			if (!fieldValue) return;
			
			// Parse field value - could be list or space-separated
			var targets;
			if (fieldName === "tags") {
				// Tags are stored as a list
				targets = nodeTiddler.getFieldList(fieldName) || [];
			} else {
				// Try to parse as list via the field list method
				targets = nodeTiddler.getFieldList(fieldName);
				if (!targets || targets.length === 0) {
					// Fall back to splitting by whitespace
					targets = fieldValue.split(/\s+/).filter(function(t) { return t; });
				}
			}
			
			// Create edges to targets that are also nodes
			targets.forEach(function(targetTitle) {
				if (nodeIdMap[targetTitle]) {
					var targetId = nodeIdMap[targetTitle];
					var edgeKey = sourceId + "-->" + targetId;
					
					// Only add if not already added
					if (!edgeSet.has(edgeKey)) {
						edgeSet.add(edgeKey);
						// Label edges with the field name (e.g., father, relates, tags)
						var label = fieldName;
						// Mermaid syntax with label: A -->|label| B
						output.push("    " + sourceId + " -->|" + escapeLabel(label) + "| " + targetId);
					}
				}
			}, this);
		}, this);
	}, this);
	
	return output.join("\n");
};
