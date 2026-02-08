/*\

Defines behavior for enum types in graph engine properties.

\*/

"use strict";

exports.name = "enum";

exports.toProperty = function(info, value) {
	var values = $tw.utils.parseStringArray(value);
	if(value === " ") {
		// Little exception here for backward-compatibleness,
		// back when I used to allow spaces as values
		values = [" "];
	}
	for (var i = 0; i < values.length; i++) {
		if (info.values.indexOf(values[i]) >= 0) {
			return values[i];
		}
	}
	return null;
};
