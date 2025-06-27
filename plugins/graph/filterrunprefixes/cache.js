/*\
title: $:/plugins/flibbles/graph/filterrunprefixes/cache.js
type: application/javascript
module-type: filterrunprefix

Allows the results of a filter run to be cached for later filter executions.
The runs MUST be generator functions. Local-run input is ignored, but run is
executed each time

\*/

"use strict";

// The counter is an incrementing  value we use to uniquely identify
// instances of opFunction. opFunction, in turn, is cached by TW's limited
// cache of compiled filters.
var counter = 0;

exports.cache = function(operationSubFunction, options) {
	var opFunction = function(results, _/*ignored source*/, widget) {
		// Use the input from previous runs as currentTiddlers.
		// If there was not input, then we'll introduce an empty string as
		// currentTiddler.
		var inputTitles = results.toArray();
		if (inputTitles.length == 0) {
			inputTitles.push("");
		}
		results.clear();
		var root = options.wiki.getGlobalCache("filterPrefix-" + opFunction.cacheKey, function() { return Object.create(null); });
		for (var i = 0; i < inputTitles.length; i++) {
			var current = inputTitles[i];
			// Roots start as {}, or a Node that is not yet Branch or Leaf
			root[current] = root[current] || {};
			var output = execute(current, root[current], operationSubFunction, widget);
			results.push.apply(results, output);
		}
	};
	opFunction.cacheKey = counter++;
	return opFunction;
};

/*
Node = { } // A node begins as undefined until we make it a branch or node.
Branch = {
	variable: "Variable name",
	options: (options that came with getVariable call)
	children: { "variable value": <Node>, ...},
}
Leaf = {
	value: ["Outputs", ...]
}
*/

function execute(currentTiddler, root, operationSubFunction, widget) {
	// First, try to retrieve from cache if it's available
	var node = root;
	var variables = {currentTiddler: currentTiddler};
	var mockWidget = widget.makeFakeWidgetWithVariables(variables);
	do {
		if (node.value !== undefined) {
			// We have a value to return
			return node.value;
		}
		if (node.variable === undefined) {
			// No value, and no variable either. Must be a fresh cache.
			// This should only happen with the root node. It's the only one
			// that isn't necessarily a Branch or Leaf when execute starts.
			break;
		}
		var info = mockWidget.getVariableInfo(node.variable, node.options);
		node = node.children[info.text];
	} while (node !== undefined);
	// It wasn't cached. We must now start back at the root and begin recording
	node = root;
	var trackWidget = widget.makeFakeWidgetWithVariables(variables);
	var visited = Object.create(null);
	trackWidget.oldVariable = trackWidget.getVariable;
	trackWidget.getVariable = function(name, options) {
		var value = this.oldVariable(name, options);
		extendTree(name, value, options);
		return value;
	};
	trackWidget.oldVariableInfo = trackWidget.getVariableInfo;
	trackWidget.getVariableInfo = function(name, options) {
		var info = this.oldVariableInfo(name, options);
		extendTree(name, info.text, options);
		return info;
	};
	function extendTree(name, value, options) {
		// We don't need to extend the tree for currentTiddler.
		// It's already accounted for.
		// Also, if we've already encountered this variable, no need to
		// extend the tree again.
		if (name !== "currentTiddler" && !visited[name]) {
			visited[name] = true;
			// Logically, we're pointing at a node that does not have a value.
			if (node.variable === undefined) {
				// It's an undefined node. Make it a branch.
				node.variable = name;
				node.options = options;
				node.children = Object.create(null);
			} else if (node.variable !== name) {
				// Unexpected. Variables should always be called in
				// the same order that they were before.
				throw "Non-deterministic filter";
			}
			var child = node.children[value];
			if (child === undefined) {
				child = node.children[value] = {};
			}
			node = child;
		}
	}
	var output = operationSubFunction(function() {/*No source*/}, trackWidget);
	// Change the current node (which is undefined) into a leaf.
	node.value = output;
	return output;
};
