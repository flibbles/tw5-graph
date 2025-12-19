/*\
title: $:/plugins/flibbles/graph/filters/graphnodes.js
type: application/javascript
module-type: filteroperator

Filter operator that returns all node titles that are members of a specified graph.

Usage: [graphnodes[$:/graph/MyGraph]]

This operator retrieves the filter field from the graph tiddler and returns
all the node titles listed in it.

\*/

"use strict";

exports.graphnodes = function(source, operator, options) {
	var results = [];
	var graphTitle = operator.operand;
	
	if (!graphTitle) {
		return results;
	}
	
	var graphTiddler = options.wiki.getTiddler(graphTitle);
	if (!graphTiddler) {
		return results;
	}
	
	// Get the filter field which contains a filter expression
	var filterField = graphTiddler.getFieldString("filter");
	if (!filterField) {
		return results;
	}
	
	// Execute the filter expression to get the node titles
	// The filter field is a TiddlyWiki filter expression, not just a space-separated list
	return options.wiki.filterTiddlers(filterField, options.widget);
};
