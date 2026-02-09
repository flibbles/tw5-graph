/*\

Defines behavior for enum types in graph engine properties.

\*/

"use strict";

exports.name = "enum";

exports.toProperty = function(info, value) {
	if (info.multiple) {
		var values = $tw.utils.parseStringArray(value);
		if (values.length === 0) {
			return values;
		}
		var filtered = values.filter(v => info.values.indexOf(v) >= 0);
		if (filtered.length > 0) {
			return filtered;
		}
	} else if (value && info.values.indexOf(value) >= 0) {
		return value;
	}
	return null;
};
