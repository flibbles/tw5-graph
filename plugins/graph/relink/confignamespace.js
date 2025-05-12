/*\
title: $:/plugins/flibbles/graph/relink/confignamespace.js
type: application/javascript
module-type: relinkoperator

Takes care of relinking property data tiddlers
in the $:/config/flibbles/graph namespace..

\*/

"use strict";

exports.name = "graph-properties";

var utils = require("../utils.js");
var relinkUtils = require("$:/plugins/flibbles/relink/js/utils.js");
var PropertyTypes = $tw.modules.getModulesByTypeAsHashmap("graphpropertytype");
var namespace = "$:/config/flibbles/graph/";
var jsonType = "application/json";


exports.report = function(tiddler, callback, options) {
	forEachProperty(options.wiki, tiddler, function(key, data, relinker) {
		relinker.report(data[key], function(title, blurb, info) {
			var suffix = blurb? (": " + blurb): "";
			callback(title, key + suffix, info);
		}, options);
	});
};

exports.relink = function(tiddler, fromTitle, toTitle, changes, options) {
	var changed, tiddlerData;
	var type = tiddler.fields.type;
	var impossible = false;
	forEachProperty(options.wiki, tiddler, function(key, data, relinker) {
		var lineEntry = relinker.relink(data[key], fromTitle, toTitle, options);
		if (lineEntry) {
			changed = true;
			if (lineEntry.output) {
				data[key] = lineEntry.output;
				tiddlerData = data;
				if (!isLegalDictionaryValue(lineEntry.output)) {
					type = jsonType;
					changes.type = {output: jsonType};
				}
			}
			impossible = lineEntry.impossible || impossible;
		}
	});
	if (changed) {
		changes.text = {};
		if (tiddlerData) {
			var text;
			if (type === jsonType) {
				text = JSON.stringify(tiddlerData, null, $tw.config.preferences.jsonSpaces);
			} else {
				text = $tw.utils.makeTiddlerDictionary(tiddlerData);
			}
			changes.text.output = text;
		}
		if (impossible) {
			changes.text.impossible = true;
		}
	}
};

function forEachProperty(wiki, tiddler, callback) {
	var title = tiddler.fields.title;
	if ($tw.utils.startsWith(title, namespace)) {
		var slashPos = title.indexOf("/", namespace.length);
		if (slashPos >= 0) {
			var objectType = title.substring(namespace.length, slashPos);
			var engine = getEngine(wiki);
			if (engine) {
				var properties = engine.prototype.properties[objectType];
				var data = wiki.getTiddlerData(title);
				if (properties && data) {
					for (var key in data) {
						var propertyInfo = properties[key];
						if (propertyInfo) {
							var propertyClass = PropertyTypes[propertyInfo.type];
							if (propertyClass && propertyClass.type) {
								var relinker = relinkUtils.getType(propertyClass.type);
								if (relinker) {
									callback(key, data, relinker);
								}
							}
						}
					}
				}
			}
		}
	}
};

function isLegalDictionaryValue(text) {
	return text.indexOf("\n") < 0;
};

function getEngine(wiki) {
	var value = wiki.getTiddlerText("$:/config/flibbles/graph/engine");
	return utils.getEngine(value);
};
