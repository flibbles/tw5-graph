/*\
title: $:/plugins/flibbles/graph/relink/attributes.js
type: application/javascript
module-type: relinkhtmlattributes

Relinks attributes of $properties and other graph object widgets.

\*/

"use strict";

exports.name = "graph";

var utils = require("../utils.js");
var relinkUtils = require("$:/plugins/flibbles/relink/js/utils.js");
var PropertyTypes = $tw.modules.getModulesByTypeAsHashmap("graphpropertytype");

exports.getHandler = function(element, attribute, options) {
	if (element.tag === "$properties") {
		var name = attribute.name;
		if (name[0] !== "$") {
			var forObject = element.attributes["$for"] || "nodes";
			var engine = getEngine(options.wiki);
			if (engine) {
				var properties = engine.prototype.properties[forObject];
				if (properties) {
					var propertyInfo = properties[attribute.name];
					if (propertyInfo) {
						var propertyClass = PropertyTypes[propertyInfo.type];
						if (propertyClass && propertyClass.type) {
							return relinkUtils.getType(propertyClass.type);
						}
					}
				}
			}
		}
	}
};

function getEngine(wiki) {
	var value = wiki.getTiddlerText("$:/config/flibbles/graph/engine");
	return utils.getEngine(value);
};
