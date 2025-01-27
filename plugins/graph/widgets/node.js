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

NodeWidget.prototype.execute = function() {
	this.title = this.getVariable("currentTiddler");
	// We're new, so we're changed. Announce ourselves when asked.
	this.changed = true;
};

NodeWidget.prototype.getGraphData = function() {
	if (this.changed) {
		this.changed = false;
		return { id: this.title, label: this.title };
	}
	return null;
};

NodeWidget.prototype.refresh = function(changedTiddlers) {
	return this.refreshChildren(changedTiddlers);
};

exports.node = NodeWidget;
