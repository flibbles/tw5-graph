/*\
title: $:/plugins/flibbles/graph/relink/fieldedges.js
type: application/javascript
module-type: relinkoperator

Takes care of relinking everything view related.
Such as the tiddlers in the $:/graph/ namespace.

\*/

"use strict";

// We only use this module if relink-fieldnames is installed and active
// Otherewise we don't engage in renaming field edges.
if ($tw.wiki.getShadowSource("$:/plugins/flibbles/relink-fieldnames/utils.js")) {

exports.name = "graph-fieldEdges";

var utils = require("$:/plugins/flibbles/relink-fieldnames/utils.js");
var prefix = "$:/config/flibbles/graph/edges/fields/";

exports.report = function(tiddler, callback, options) {
	var title = tiddler.fields.title;
	if ($tw.utils.startsWith(title, prefix)) {
		var field = title.substr(prefix.length);
		if (!utils.isReserved(field, options)) {
			callback(field, "#graph field edgetype: " + field);
		}
	}
};

exports.relink = function(tiddler, fromTitle, toTitle, changes, options) {
	var title = tiddler.fields.title;
	if ($tw.utils.startsWith(title, prefix)) {
		var field = title.substr(prefix.length);
		if (field === fromTitle && !utils.isReserved(field, options)) {
			if (utils.isReserved(toTitle, options)
			|| options.wiki.tiddlerExists(prefix + toTitle)) {
				changes.title = {impossible: true};
			} else {
				changes.title = {output: prefix + toTitle};
			}
		}
	}
};

}
