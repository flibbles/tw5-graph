/*\
title: $:/plugins/flibbles/graph/relink/graphprefix.js
type: application/javascript
module-type: relinkprefix

Takes care of relinking everything graphTiddler related.
Such as the tiddlers in the $:/graph/ namespace.

\*/

"use strict";

exports.prefix = "$:/graph/";

var utils = require("./utils.js");
var tag = "$:/tags/flibbles/graph/TiddlerData";

exports.report = function(tiddler, callback, options) {
	if (!tiddler.hasTag(tag)) {
		return utils.reportTiddlerData(tiddler, callback, options);
	}
};

exports.relink = function(tiddler, fromTitle, toTitle, changes, options) {
	if (!tiddler.hasTag(tag)) {
		return utils.relinkTiddlerData(tiddler, fromTitle, toTitle, changes, options);
	}
};
