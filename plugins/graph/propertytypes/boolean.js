/*\

Defines behavior for boolean types in graph engine properties.

\*/

"use strict";

exports.name = "boolean";

exports.toProperty = function(info, value) {
	switch (value.toLowerCase()) {
		case "yes":
		case "true":
		case "1":
		case "y":
		case "t":
			return true;
		default:
			return false;
	}
};
