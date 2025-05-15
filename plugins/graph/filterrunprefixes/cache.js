/*\
title: $:/plugins/flibbles/graph/filterrunprefixes/cache.js
type: application/javascript
module-type: filterrunprefix

Allows the results of a filter run to be cached for later filter executions.
The runs MUST be generator functions. Input is ignored.

\*/

"use strict";

var counter = 0;

exports.cache = function(operationSubFunction, options) {
	var opFunction = function(results, _/*ignored source*/, widget) {
		var inputTitles = results.toArray();
		if (inputTitles.length == 0) {
			inputTitles.push("");
		}
		results.clear();
		var comboMap = options.wiki.getGlobalCache("filterPrefix-" + opFunction.cacheKey, function() { return Object.create(null); });
		for (var i = 0; i < inputTitles.length; i++) {
			var current = inputTitles[i];
			comboMap[current] = comboMap[current] || operationSubFunction(function(){}, monitorFor(widget, current));
			results.pushTop(comboMap[current]);
		}
	};
	opFunction.cacheKey = counter++;
	return opFunction;
};

function monitorFor(widget, current) {
	var monitor = Object.create(widget);
	monitor.getVariableInfo = function(name, options) {
		if (name === "currentTiddler") {
			return {text: current};
		} else {
			return {text: undefined};
		}
	}
	return monitor;
};
