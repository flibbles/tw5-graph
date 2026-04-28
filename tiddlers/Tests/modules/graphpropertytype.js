/*\
module-type: graphpropertytype

This is a test property type which yanks the value from sibling properties,
allowing us to test trying to grab otherwise-undefined properties.

This is otherwise only possible by using the image property type, but
we don't want to make image property tests in order to test fetching
types (like color and filter) from another property.

\*/

"use strict";

exports.name = "test";

exports.toProperty = function(info, value, options) {
	if (!info.only || info.only === "evaluate") {
		return options.widget.evaluateProperty(value);
	}
	return null;
};

exports.refresh = function(info, value, changedTiddlers, widget) {
	if (!info.only || info.only === "refresh") {
		return widget.refreshProperty(value, changedTiddlers);
	}
	return false;
};
