/*\
title: $:/plugins/flibbles/graph/relink/propertyfields.js
type: application/javascript
module-type: relinkoperator

Takes care of relinking graph.* properties across all tiddlers.

\*/

"use strict";

exports.name = "graph fields";

var utils = require("./utils.js");
var fieldPrefix = "graph.";
var tag = "$:/tags/flibbles/graph/TiddlerData";

exports.report = function(tiddler, callback, options) {
	if (tiddler.hasTag(tag)) {
		utils.reportTiddlerData(tiddler, callback, options);
	}
	for (var field in tiddler.fields) {
		if ($tw.utils.startsWith(field, fieldPrefix)) {
			var type = field.substr(fieldPrefix.length);
			var data;
			try {
				data = JSON.parse(tiddler.fields[field]);
			} catch {}
			utils.forEachPropertyIn(data, type, options.wiki, function(key, data, relinker) {
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
	if (tiddler.hasTag(tag)) {
		utils.relinkTiddlerData(tiddler, fromTitle, toTitle, changes, options);
	}
	var changedField = {};
	var impossibleFields = {};
	for (var field in tiddler.fields) {
		if ($tw.utils.startsWith(field, fieldPrefix)) {
			var fieldData = undefined,
				changed = false,
				impossible = false;
			var type = field.substr(fieldPrefix.length);
			var data;
			try {
				data = JSON.parse(tiddler.fields[field]);
			} catch {}
			utils.forEachPropertyIn(data, type, options.wiki, function(key, data, relinker) {
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
