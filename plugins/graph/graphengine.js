/*\
title: $:/plugins/flibbles/graph/graphengine.js
type: application/javascript
module-type: macro

Macro returns the graph engine of choice within the current context.

\*/

"use strict";

var utils = require("./utils.js");
var config = "$:/config/flibbles/graph/engine";

exports.name = "graphengine";
exports.params = [];

exports.run = function() {
	return exports.get(this.wiki);
};

exports.get = function(wiki) {
	return wiki.getCacheForTiddler(config, "graphengine", function() {
		var specified = wiki.getTiddlerText(config);
		if (specified) {
			return specified;
		} else {
			var engineMap = utils.getEngineMap();
			var keys = Object.keys(engineMap);
			if (keys.length > 0) {
				// We go with the first one by alphabetical order
				keys.sort();
				return keys[0];
			}
		}
		return "";
	});
};
