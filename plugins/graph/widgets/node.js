/*\
title: $:/plugins/flibbles/graph/widgets/node.js
type: application/javascript
module-type: widget

Widget for creating nodes within graphs.

\*/

"use strict";

var Widget = require("$:/core/modules/widgets/widget.js").widget;

var NodeWidget = function(parseTreeNode, options) {
	this.initialise(parseTreeNode, options);
};

NodeWidget.prototype = new Widget();

NodeWidget.prototype.render = function(parent, nextSibling) {
	this.parentDomNode = parent;
	this.computeAttributes();
	this.execute();
	this.renderChildren();
};

NodeWidget.prototype.execute = function() {
	this.id = this.getVariable("currentTiddler");
	this.label = this.getAttribute("label");
	// We're new, so we're changed. Announce ourselves when asked.
	this.changed = true;
};

NodeWidget.prototype.getNodeData = function(objects) {
	if (this.changed) {
		this.changed = false;
		var data = {}
		if (this.label) {
			data.label = this.label;
		}
		return data;
	}
};

NodeWidget.prototype.refresh = function(changedTiddlers) {
	var changedAttributes = this.computeAttributes();
	if (changedAttributes.label) {
		this.refreshSelf();
		return true;
	}
	return this.refreshChildren(changedTiddlers);
};

exports.node = NodeWidget;
