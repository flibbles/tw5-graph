/*\
title: $:/plugins/flibbles/graph/relink/fieldedgeprefix.js
type: application/javascript
module-type: relinkprefix

Takes care of relinking all edge property files in the "field" category.

\*/

"use strict";

// We only use this module if relink-fieldnames is installed and active
// Otherewise we don't engage in renaming field edges.
if ($tw.wiki.getShadowSource("$:/plugins/flibbles/relink-fieldnames/utils.js")) {

exports.prefix = "$:/config/flibbles/graph/edges/fields/";

var utils = require("$:/plugins/flibbles/relink-fieldnames/utils.js");

exports.report = function(tiddler, callback, options) {
	var field = tiddler.fields.title.substr(exports.prefix.length);
	if (!utils.isReserved(field, options)) {
		callback(field, "#graph field edgetype: " + field);
	}
};

exports.relink = function(tiddler, fromTitle, toTitle, changes, options) {
	var field = tiddler.fields.title.substr(exports.prefix.length);
	if (field === fromTitle && !utils.isReserved(field, options)) {
		if (utils.isReserved(toTitle, options)
		|| options.wiki.tiddlerExists(exports.prefix + toTitle)) {
			changes.title = {impossible: true};
		} else {
			changes.title = {output: exports.prefix + toTitle};
		}
	}
};

}
