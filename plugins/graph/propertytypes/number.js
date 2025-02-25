/*\
title: $:/plugins/flibbles/graph/propertytypes/number.js
type: application/javascript
module-type: graphpropertytype

Defines behavior for number types in graph engine properties.

\*/

"use strict";

exports.name = "number";

exports.toProperty = function(info, value) {
	value = parseFloat(value);
	if (info.min !== undefined && value < info.min) {
		value = info.min;
	}
	if (info.max !== undefined && value > info.max) {
		value = info.max;
	}
	return value;
};
