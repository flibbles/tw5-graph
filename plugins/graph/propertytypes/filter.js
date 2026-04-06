/*\

Defines behavior for filter types in graph engine properties.
The property values are strings which are processed as filters.
The results are passed to the underlying engine as an array.

\*/

"use strict";

exports.name = "filter";

exports.type = "filter";

exports.toProperty = function(info, value, options) {
	var widget = options.widget;
	var output = widget.wiki.filterTiddlers(value, widget);
	widget._graphFilterCache = widget._graphFilterCache || Object.create(null);
	widget._graphFilterCache[value] = output;
	if (output.length > 0) {
		return output;
	}
	return null;
};

exports.refresh = function(info, value, changedTiddlers, widget) {
	var output = widget.wiki.filterTiddlers(value, widget);
	if (!match(output, widget._graphFilterCache[value])) {
		return true;
	}
	return false;
};

function match(arrayA, arrayB) {
	if ((!arrayA || !arrayB) && (arrayA !== arrayB)) {
		return false;
	}
	if (arrayA.length !== arrayB.length) {
		return false;
	}
	for (var i = 0; i < arrayA.length; i++) {
		if (arrayA[i] !== arrayB[i]) {
			return false;
		}
	}
	return true;
};
