/*\
title: $:/plugins/flibbles/graph/feldtypes/title.js
type: application/javascript
module-type: fieldtype

\*/

exports.name = "title";

exports.get = function(tiddler, field) {
	var value = tiddler.getFieldString(field);
	return value? [value]: [];
};
