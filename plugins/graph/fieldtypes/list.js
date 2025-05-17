/*\
title: $:/plugins/flibbles/graph/fieldtypes/list.js
type: application/javascript
module-type: fieldtype

\*/

exports.name = "list";

exports.add = function(tiddler, field, value, options) {
	var array = (tiddler && tiddler.getFieldList(field)) || [];
	if (array.indexOf(value) < 0) {
		array.push(value);
		return $tw.utils.stringifyList(array);
	}
};

exports.remove = function(tiddler, field, value, options) {
	var array = (tiddler && tiddler.getFieldList(field)) || [];
	var index = array.indexOf(value);
	if (index >= 0) {
		array.splice(index, 1);
		return $tw.utils.stringifyList(array);
	}
};

exports.get = function(tiddler, field, options) {
	return tiddler.getFieldList(field);
};
