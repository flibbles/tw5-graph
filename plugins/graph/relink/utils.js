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
	var value = $tw.macros.graphengine.get(wiki);
	return baseUtils.getEngine(value);
};

exports.reportTiddlerData = function(tiddler, callback, options) {
	var data = options.wiki.getTiddlerDataCached(tiddler.fields.title, {});
	for (var title in data) {
		callback(title, data[title], {soft: true});
	}
};

exports.relinkTiddlerData = function(tiddler, fromTitle, toTitle, changes, options) {
	var data = options.wiki.getTiddlerDataCached(tiddler.fields.title, {});
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
};

function isLegalDictionaryKey(title) {
	// We make a microdictionary with the value and make sure we get back
	// a dictionary with the key pointing to an arbitrary x
	var fields = $tw.utils.parseFields(title + ":x");
	var found = false;
	for (var key in fields) {
		if (found
		|| key !== title
		|| fields[key] !== "x") {
			return false;
		}
		found = true;
	}
	return found;
};
