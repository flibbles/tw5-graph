/*\
title: $:/plugins/flibbles/graph/relink/attributes.js
type: application/javascript
module-type: relinkhtmlattributes

Relinks attributes of $properties and other graph object widgets.

\*/

"use strict";

exports.name = "graph";

var utils = require("./utils.js");
var graphObjects = Object.create(null);

$tw.modules.forEachModuleOfType("widget-subclass", function(subclass, module) {
	var type = module.prototype.graphObjectType;
	if (module.baseClass === "graphobject") {
		graphObjects["$" + module.name] = function() { return type; };
	}
});

graphObjects["$graph"] = function() { return "graph"; };

graphObjects["$properties"] = function(element) {
	var forAttr = element.attributes["$for"];
	return (forAttr && forAttr.value) || "nodes";
};

exports.getHandler = function(element, attribute, options) {
	var forFunc = graphObjects[element.tag];
	if (forFunc) {
		return processAttribute(forFunc(element), attribute, options);
	}
};

function processAttribute(forObject, attribute, options) {
	var name = attribute.name;
	if (name[0] !== "$") {
		var engine = utils.getEngine(options.wiki);
		if (engine) {
			var properties = engine.prototype.properties[forObject];
			if (properties) {
				var propertyInfo = properties[attribute.name];
				return utils.getRelinker(propertyInfo);
			}
		}
	}
};
