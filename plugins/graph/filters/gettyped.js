/*\
title: $:/plugins/flibbles/graph/filters/gettyped.js
type: application/javascript
module-type: filteroperator

Filter operator which replcaes tiddler titles with the values of the field of the specified operand, but does so in a way that's responsive to the type of field, depending on how it's configured by Relink.

\*/

"use strict";

var typeOperators = $tw.modules.getModulesByTypeAsHashmap("fieldtype");
var relinkPrefix = "$:/config/flibbles/relink/fields/" ;

exports.gettyped = function(source, operator, options) {
	var results = [];
	var field = operator.operand;
	var typeName = options.wiki.getTiddlerText(relinkPrefix + field, "list");
	var type = typeOperators[typeName] || typeOperators.list;
	source(function(tiddler, title) {
		if (tiddler) {
			results.push.apply(results, type.get(tiddler, field, options));
		}
	});
	return results;
};
