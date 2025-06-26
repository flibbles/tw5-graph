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
		// Root starts as {}, or a Node that is not yet Branch or Leaf
		var root = options.wiki.getGlobalCache("filterPrefix-" + opFunction.cacheKey, function() { return {}; });
		for (var i = 0; i < inputTitles.length; i++) {
			var current = inputTitles[i];
			var output = execute(current, root, operationSubFunction, widget);
			results.pushTop(output);
		}
	};
	opFunction.cacheKey = counter++;
	return opFunction;
};

/*
Node = { } // A node begins as undefined until we make it a branch or node.
Branch = {
	variable: "Variable name",
	children: { "variable value": <Node>, ...},
}
Leaf = {
	value: ["Outputs", ...]
}
*/

function execute(currentTiddler, root, operationSubFunction, widget) {
	// First, try to retrieve from cache if it's available
	var node = root;
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
		var value = node.variable === "currentTiddler"?
			currentTiddler:
			widget.getVariable(node.variable);
		node = node.children[value];
	} while (node !== undefined);
	// It wasn't cached. We must now start back at the root and begin recording
	node = root;
	var mockWidget = Object.create(widget);
	mockWidget.getVariableInfo = function(name, options) {
		// Logically, we're pointing at a node that does not have a value.
		if (node.variable === undefined) {
			// It's an undefined node. Make it a branch.
			node.variable = name;
			node.children = Object.create(null);
		} else if (node.variable !== name) {
			// Unexpected. Variables should always be called in the same order
			// that they were before.
			throw "Non-deterministic filter";
		}
		// We use our own currentTiddler to prevent variable-request spamming.
		// CurrentTiddler frequently gets called when not needed.
		var info = (name === "currentTiddler")?
			{text: currentTiddler}:
			widget.getVariableInfo(name, options);
		var child = node.children[info.text];
		if (child === undefined) {
			child = node.children[info.text] = {};
		}
		node = child;
		return info;
	};
	var output = operationSubFunction(function() {/*No source*/}, mockWidget);
	// Change the current node (which is undefined) into a leaf.
	node.value = output;
	return output;
};
