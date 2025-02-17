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

NodeWidget.prototype.graphObjectType = "nodes";

NodeWidget.prototype.render = function(parent, nextSibling) {
	this.parentDomNode = parent;
	this.computeAttributes();
	this.execute();
	this.renderChildren(parent, nextSibling);
};

NodeWidget.prototype.execute = function() {
	this.pos = this.getAttribute("pos");
	this.id = this.getAttribute("tiddler", this.getVariable("currentTiddler"));
	this.label = this.getAttribute("label");
	// We're new, so we're changed. Announce ourselves when asked.
	this.changed = true;
	this.makeChildWidgets();
};

NodeWidget.prototype.refresh = function(changedTiddlers) {
	var changedAttributes = this.computeAttributes();
	if (changedAttributes.pos || changedAttributes.label || changedAttributes.tiddler) {
		this.refreshSelf();
		return true;
	}
	return this.refreshChildren(changedTiddlers);
};

NodeWidget.prototype.allowActionPropagation = function() {
	return false;
};

NodeWidget.prototype.getGraphObject = function(style) {
	return this.object;
};

/* When testing applicability in a $style filter, use the tiddler title
 * as the input source.
 */
NodeWidget.prototype.getGraphFilterSource = function() {
	return [this.id];
}

NodeWidget.prototype.setStyle = function(data) {
	if (this.label) {
		data.label = this.label;
	}
	if (this.pos) {
		var points = this.pos.split(",");
		data.x = parseFloat(points[0]);
		data.y = parseFloat(points[1]);
	}
	this.object = data
};

exports.node = NodeWidget;
