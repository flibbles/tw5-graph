/*\
title: $:/plugins/flibbles/graph/propertytypes/string.js
type: application/javascript
module-type: graphpropertytype

Defines behavior for string types in graph engine properties.

\*/

"use strict";

exports.name = "string";

exports.toProperty = function(info, value) {
	return value || null;
};
