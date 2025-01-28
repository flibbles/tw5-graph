/*\
title: $:/plugins/flibbles/graph/widgets/edge.js
type: application/javascript
module-type: widget

Widget for creating edges within graphs.

\*/

"use strict";

var Widget = require("$:/core/modules/widgets/widget.js").widget;
var nextId = 1;

var EdgeWidget = function(parseTreeNode, options) {
	this.initialise(parseTreeNode, options);
};

EdgeWidget.prototype = new Widget();

EdgeWidget.prototype.render = function() {
	this.computeAttributes();
	this.execute();
};

EdgeWidget.prototype.execute = function() {
	this.id = nextId;
	nextId++;
	this.toTiddler = this.getAttribute("to");
	this.fromTiddler = this.getVariable("currentTiddler");
	this.label = this.getAttribute("label");
	// We're new, so we're changed. Announce ourselves when asked.
	this.changed = true;
	this.makeChildWidgets();
};

EdgeWidget.prototype.refresh = function() { return false; };

EdgeWidget.prototype.getEdgeData = function() {
	if (this.changed) {
		this.changed = false;
		return {
			from: this.fromTiddler,
			to: this.toTiddler,
			label: this.label
		};
	}
};

exports.edge = EdgeWidget;
