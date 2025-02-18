/*\
title: $:/plugins/flibbles/graph/utils.js
type: application/javascript
module-type: library

Utility methods used by the graphing widgets.

\*/

"use strict";

var Engines = $tw.modules.applyMethods("graphengineadapter");

exports.getEngineMap = function() {
	return Engines;
};

exports.getEngine = function(name) {
	var engineMap = exports.getEngineMap();
	if (name) {
		return engineMap[name] || null;
	}
	for (var entry in engineMap) {
		// take the first one
		return engineMap[entry];
	}
	return null;
};
