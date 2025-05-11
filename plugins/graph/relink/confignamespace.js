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
			var data = options.wiki.getTiddlerData(title);
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
	/*
	var title = tiddler.fields.title;
	if ($tw.utils.startsWith(title, "$:/graph/")) {
		var data = options.wiki.getTiddlerDataCached(title, {});
		if (data[fromTitle] !== undefined) {
			var newData = {};
			for (var title in data) {
				if (title === fromTitle) {
					newData[toTitle] = data[title];
				} else {
					newData[title] = data[title];
				}
			}
			var newText;
			var type = tiddler.fields.type;
			if (type === "application/x-tiddler-dictionary") {
				if (isLegalDictionaryKey(toTitle)) {
					newText = $tw.utils.makeTiddlerDictionary(newData);
				} else {
					type = "application/json";
					changes.type = {output: type};
				}
			}
			if (type === "application/json") {
				newText = JSON.stringify(newData, null, $tw.config.preferences.jsonSpaces);
			}
			changes.text = {output: newText};
		}
	}
	*/
};

function getEngine(wiki) {
	var value = wiki.getTiddlerText("$:/config/flibbles/graph/engine");
	return utils.getEngine(value);
};
