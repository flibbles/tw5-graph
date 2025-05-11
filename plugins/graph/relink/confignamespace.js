/*\
title: $:/plugins/flibbles/graph/relink/confignamespace.js
type: application/javascript
module-type: relinkoperator

Takes care of relinking property data tiddlers
in the $:/config/flibbles/graph namespace..

\*/

"use strict";

var utils = require("../utils.js");
var relinkUtils = require("$:/plugins/flibbles/relink/js/utils.js");
var PropertyTypes = $tw.modules.getModulesByTypeAsHashmap("graphpropertytype");

exports.name = "graph-properties";
var namespace = "$:/config/flibbles/graph/";


exports.report = function(tiddler, callback, options) {
	var title = tiddler.fields.title;
	if ($tw.utils.startsWith(title, namespace)) {
		var slashPos = title.indexOf("/", namespace.length);
		if (slashPos >= 0) {
			var objectType = title.substring(namespace.length, slashPos);
			var engine = getEngine(options.wiki);
			var properties = engine.prototype.properties[objectType];
			var data = options.wiki.getTiddlerDataCached(title);
			if (properties && data) {
				for (var key in data) {
					var propertyInfo = properties[key];
					var propertyType = propertyInfo.type;
					var propertyClass = PropertyTypes[propertyType];
					if (propertyClass && propertyClass.type) {
						var relinker = relinkUtils.getType(propertyClass.type);
						if (relinker) {
							relinker.report(data[key], function(title, blurb, info) {
								var suffix = blurb? (": " + blurb): "";
								callback(title, key + suffix, info);
							}, options);
						}
					}
				}
			}
		}
	}
};

exports.relink = function(tiddler, fromTitle, toTitle, changes, options) {
	var title = tiddler.fields.title;
	if ($tw.utils.startsWith(title, namespace)) {
		var slashPos = title.indexOf("/", namespace.length);
		if (slashPos >= 0) {
			var changed = false;
			var objectType = title.substring(namespace.length, slashPos);
			var engine = getEngine(options.wiki);
			var properties = engine.prototype.properties[objectType];
			var data = options.wiki.getTiddlerData(title);
			if (properties && data) {
				for (var key in data) {
					var propertyInfo = properties[key];
					var propertyType = propertyInfo.type;
					var propertyClass = PropertyTypes[propertyType];
					if (propertyClass && propertyClass.type) {
						var relinker = relinkUtils.getType(propertyClass.type);
						if (relinker) {
							var lineEntry = relinker.relink(data[key], fromTitle, toTitle, options);
							if (lineEntry && lineEntry.output) {
								changed = true;
								data[key] = lineEntry.output;
							}
						}
					}
				}
			}
			if (changed) {
				changes.text = {output: JSON.stringify(data, null, $tw.config.preferences.jsonSpaces)};
			}
		}
	}
};

function getEngine(wiki) {
	var value = wiki.getTiddlerText("$:/config/flibbles/graph/engine");
	return utils.getEngine(value);
};
