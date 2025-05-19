/*\
title: $:/plugins/flibbles/graph/relink/utils.js
type: application/javascript
module-type: library

These utilities only ever get loaded if Relink is installed.

\*/

"use strict";

var baseUtils = require("../utils.js");
var relinkUtils = require("$:/plugins/flibbles/relink/js/utils.js");
var PropertyTypes = $tw.modules.getModulesByTypeAsHashmap("graphpropertytype");

exports.forEachPropertyIn = function(data, objectType, wiki, callback) {
	if (data) {
		var engine = exports.getEngine(wiki);
		if (engine) {
			var properties = engine.prototype.properties[objectType];
			if (properties) {
				for (var key in data) {
					var propertyInfo = properties[key];
					var relinker = exports.getRelinker(propertyInfo);
					if (relinker) {
						callback(key, data, relinker);
					}
				}
			}
		}
	}
};

exports.getRelinker = function(propertyInfo) {
	var relinker;
	if (propertyInfo) {
		var propertyClass = PropertyTypes[propertyInfo.type];
		if (propertyClass && propertyClass.type) {
			relinker = relinkUtils.getType(propertyClass.type);
		}
	}
	return relinker;
};

exports.getEngine = function(wiki) {
	var value = wiki.getTiddlerText("$:/config/flibbles/graph/engine");
	return baseUtils.getEngine(value);
};
