/*\
title: $:/plugins/flibbles/graph/widgets/style.js
type: application/javascript
module-type: widget

Widget for setting styles on graph objects.

\*/

"use strict";

var Widget = require("$:/core/modules/widgets/widget.js").widget;

var StyleWidget = function(parseTreeNode, options) {
	this.initialise(parseTreeNode, options);
};

StyleWidget.prototype = new Widget();

StyleWidget.prototype.render = function(parent, nextSibling) {
	this.parentDomNode = parent;
	this.computeAttributes();
	this.execute();
	this.renderChildren(parent, nextSibling);
};

StyleWidget.prototype.execute = function() {
	this.styleObject = Object.create(null);
	for (var name in this.attributes) {
		if (name.charAt(0) !== '$') {
			this.styleObject[name] = this.attributes[name];
		}
	}
	this.makeChildWidgets();
};

StyleWidget.prototype.refresh = function(changedTiddlers) {
	var changedAttributes = this.computeAttributes();
	if ($tw.utils.count(changedAttributes) > 0) {
		this.refreshSelf();
		return true;
	}
	return this.refreshChildren(changedTiddlers);
};

StyleWidget.prototype.getStyleObject = function(parentStyle) {
	return Object.assign(Object.create(parentStyle), this.styleObject);
};

exports.style = StyleWidget;
