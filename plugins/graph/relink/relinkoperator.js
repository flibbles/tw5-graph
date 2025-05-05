/*\
title: $:/plugins/flibbles/graph/relink/relinkoperator.js
type: application/javascript
module-type: relinkoperator

Takes care of relinking everything graph related.
Such as the tiddlers in the $:/graph/ namespace.

\*/

"use strict";

exports.name = "graph";

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
		var data = options.wiki.getTiddlerData(title, {});
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
			if (tiddler.fields.type === "application/json") {
				newText = JSON.stringify(newData, null, $tw.config.preferences.jsonSpaces);
			} else {
				newText = $tw.utils.makeTiddlerDictionary(newData);
			}
			changes.text = {output: newText};
		}
	}
};
