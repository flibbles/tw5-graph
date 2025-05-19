/*\
title: $:/plugins/flibbles/graph/relink/graphprefix.js
type: application/javascript
module-type: relinkprefix

Takes care of relinking everything view related.
Such as the tiddlers in the $:/graph/ namespace.

\*/

"use strict";

exports.prefix = "$:/graph/";

var utils = require("./utils.js");
var fieldPrefix = "graph.";

exports.report = function(tiddler, callback, options) {
	var data = options.wiki.getTiddlerDataCached(tiddler.fields.title, {});
	for (var title in data) {
		callback(title, data[title], {soft: true});
	}
	for (var field in tiddler.fields) {
		if ($tw.utils.startsWith(field, fieldPrefix)) {
			var type = field.substr(fieldPrefix.length);
			forEachProperty(options.wiki, tiddler, type, function(key, data, relinker) {
				relinker.report(data[key], function(title, blurb, info) {
					var prefix = "#" + type + " - " + key;
					if (blurb) {
						prefix += ": " + blurb;
					}
					callback(title, prefix, info);
				}, options);
			});
		}
	}
};

exports.relink = function(tiddler, fromTitle, toTitle, changes, options) {
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
	var changedField = {};
	var impossibleFields = {};
	for (var field in tiddler.fields) {
		if ($tw.utils.startsWith(field, fieldPrefix)) {
			var fieldData = undefined,
				changed = false,
				impossible = false;
			var type = field.substr(fieldPrefix.length);
			forEachProperty(options.wiki, tiddler, type, function(key, data, relinker) {
				var lineEntry = relinker.relink(data[key], fromTitle, toTitle, options);
				if (lineEntry) {
					changed = true;
					if (lineEntry.output) {
						data[key] = lineEntry.output;
						fieldData = data;
					}
					impossible = lineEntry.impossible || impossible;
				}
			});
			if (changed) {
				changes[field] = {};
				if (fieldData) {
					var text = JSON.stringify(fieldData);
					changes[field].output = text;
				}
				if (impossible) {
					changes[field].impossible = true;
				}
			}
		}
	}
};

function forEachProperty(wiki, tiddler, type, callback) {
	var engine = utils.getEngine(wiki);
	if (engine) {
		var data;
		try {
			data = JSON.parse(tiddler.fields["graph." + type]);
		} catch {
			data = {};
		}
		var properties = engine.prototype.properties[type];
		if (properties && data) {
			for (var key in data) {
				var propertyInfo = properties[key];
				var relinker = utils.getRelinker(propertyInfo);
				if (relinker) {
					callback(key, data, relinker);
				}
			}
		}
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
