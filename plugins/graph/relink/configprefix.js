/*\
title: $:/plugins/flibbles/graph/relink/configprefix.js
type: application/javascript
module-type: relinkprefix

Takes care of relinking property data tiddlers
in the $:/config/flibbles/graph namespace.

\*/

"use strict";

exports.prefix = "$:/config/flibbles/graph/";

var utils = require("./utils.js");
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
	var slashPos = title.indexOf("/", exports.prefix.length);
	if (slashPos >= 0) {
		var objectType = title.substring(exports.prefix.length, slashPos);
		var data = wiki.getTiddlerData(title);
		utils.forEachPropertyIn(data, objectType, wiki, callback);
	}
};

function isLegalDictionaryValue(text) {
	return text.indexOf("\n") < 0;
};
