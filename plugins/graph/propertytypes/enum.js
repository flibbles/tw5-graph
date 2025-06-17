/*\

Defines behavior for enum types in graph engine properties.

\*/

"use strict";

exports.name = "enum";

exports.toProperty = function(info, value) {
	if (info.values.indexOf(value) >= 0) {
		return value;
	}
	return null;
};
