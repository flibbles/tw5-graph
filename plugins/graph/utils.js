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

exports.getEngine = function(wiki, name) {
	var engineMap = exports.getEngineMap(),
		engine,
		choice = name || wiki.getTiddlerText("$:/config/flibbles/graph/engine");
	for (var entry in engineMap) {
		engine = engineMap[entry];
		break;
	}
	if (!engine) {
		throw new Error("No graphing libraries installed.");
	}
	if (choice) {
		var engine = engineMap[choice];
		if (!engine) {
			throw new Error(name?
				"'" + name + "' graphing library not found.":
				"Graph plugin configured to use missing '" + choice + "' engine. Fix this in plugin settings.");
		}
	}
	return engine;
};

