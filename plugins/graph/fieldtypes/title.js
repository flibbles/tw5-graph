/*\
title: $:/plugins/flibbles/graph/fieldtypes/title.js
type: application/javascript
module-type: fieldtype

\*/

"use strict";

exports.name = "title";

exports.add = function(tiddler, field, value, options) {
	if (!tiddler || tiddler.fields[field] !== value) {
		return value;
	}
};

exports.remove = function(tiddler, field, value, options) {
	if (tiddler && tiddler.fields[field] === value) {
		return "";
	}
};

exports.get = function(tiddler, field) {
	var value = tiddler.getFieldString(field);
	return value? [value]: [];
};
