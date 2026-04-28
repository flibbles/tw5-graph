/*\

Defines colors, which can derive from palette colors.

\*/

"use strict";

var utils = require("../utils.js");

exports.name = "color";

exports.toProperty = function(info, value, options) {
	// If it starts with #, we don't have to bother trying to find palette
	// colors. This is 99% of the time, so worth the optimization.
	if (value == null || value.charAt(0) === "#") {
		return value;
	}
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
	var colorWidget = widget.colorWidgets[value];
	var container = $tw.fakeDocument.createElement("div");
	colorWidget.render(container, null);
	var output = container.textContent;
	if (output) {
		return output;
	}
	// Might be a CSS color;
	if (colorWidget.cssColor === undefined) {
		colorWidget.cssColor = isValidCSSColor(value)? value: null;
	}
	return colorWidget.cssColor;
};

exports.refresh = function(info, value, changedTiddlers, widget) {
	if (value && value.charAt(0) !== "#") {
		if (widget.colorWidgets
		&& widget.colorWidgets[value]
		&& widget.colorWidgets[value].refresh(changedTiddlers)) {
			return true;
		}
	}
	return false;
};

function isValidCSSColor(color) {
	var window = utils.window();
	var option = new window.Option();
	var s = option.style;
	s.color = color;
	return s.color === color;
};
