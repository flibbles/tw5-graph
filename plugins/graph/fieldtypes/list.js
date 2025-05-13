/*\
title: $:/plugins/flibbles/graph/feldtypes/list.js
type: application/javascript
module-type: fieldtype

\*/

exports.name = "list";

exports.get = function(tiddler, field, options) {
	return tiddler.getFieldList(field);
};
