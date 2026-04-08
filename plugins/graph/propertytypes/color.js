/*\

Defines colors, which can derive from palette colors.

\*/

"use strict";

exports.name = "color";

exports.toProperty = function(info, value, options) {
	// If it starts with #, we don't have to bother trying to find palette
	// colors. This is 99% of the time, so worth the optimization.
	if (value.charAt(0) !== "#") {
		var widget = options.widget;
		widget.colorWidgets = widget.colorWidgets || Object.create(null);
		if (!widget.colorWidgets[value]) {
			widget.colorWidgets[value] = widget.wiki.makeWidget({
				tree: [{
					type: "transclude",
					attributes: {
						"$variable": {type: "string", value: "colour"},
						0: {type: "string", value: value}}
				}]}, {parentWidget: widget});
		}
		return getColor(widget, value);
	}
	return value;
};

exports.refresh = function(info, value, changedTiddlers, widget) {
	if (value.charAt(0) !== "#") {
		if (widget.colorWidgets[value].refresh(changedTiddlers)) {
			return true;
		}
	}
	return false;
};

function getColor(widget, color) {
	var colorWidget = widget.colorWidgets[color];
	var container = $tw.fakeDocument.createElement("div");
	colorWidget.render(container, null);
	return container.textContent || color;
};
