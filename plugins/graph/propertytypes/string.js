/*\

Defines behavior for string types in graph engine properties.

\*/

"use strict";

exports.name = "string";

exports.toProperty = function(info, value) {
	return value || null;
};
