/*\
title: $:/plugins/flibbles/graph/relink/relinkoperator.js
type: application/javascript
module-type: relinkoperator

Takes care of relinking everything view related.
Such as the tiddlers in the $:/graph/ namespace.

\*/

"use strict";

exports.name = "graph-views";

exports.report = function(tiddler, callback, options) {
	var title = tiddler.fields.title;
	if ($tw.utils.startsWith(title, "$:/graph/")) {
		var data = options.wiki.getTiddlerDataCached(title, {});
		for (var title in data) {
			callback(title, data[title], {soft: true});
		}
	}
};

exports.relink = function(tiddler, fromTitle, toTitle, changes, options) {
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
