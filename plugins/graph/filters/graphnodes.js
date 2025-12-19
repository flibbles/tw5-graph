/*\
title: $:/plugins/flibbles/graph/filters/graphnodes.js
type: application/javascript
module-type: filteroperator

Filter operator that returns all node titles that are members of graphs from the input.

Usage: [[$:/graph/MyGraph]graphnodes[]]
       [prefix[$:/graph/]graphnodes[]]

This operator processes each input tiddler as a graph, retrieves its filter field,
and returns all the node titles from those graphs.

\*/

"use strict";

exports.graphnodes = function(source, operator, options) {
	var results = [];
	var seen = Object.create(null);
	
	source(function(tiddler, title) {
		if (!tiddler) {
			return;
		}
		
		// Get the filter field which contains a filter expression
		var filterField = tiddler.getFieldString("filter");
		if (!filterField) {
			return;
		}
		
		// Execute the filter expression to get the node titles
		// The filter field is a TiddlyWiki filter expression
		var nodes = options.wiki.filterTiddlers(filterField, options.widget);
		
		// Add nodes to results, avoiding duplicates
		for (var i = 0; i < nodes.length; i++) {
			var node = nodes[i];
			if (!seen[node]) {
				seen[node] = true;
				results.push(node);
			}
		}
	});
	
	return results;
};
