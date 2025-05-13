/*\
title: $:/plugins/flibbles/graph/feldtypes/filter.js
type: application/javascript
module-type: fieldtype

\*/

exports.name = "filter";

exports.get = function(tiddler, field, options) {
	var filterStr = tiddler.getFieldString(field);
	return options.wiki.filterTiddlers(filterStr, options.widget);
};
