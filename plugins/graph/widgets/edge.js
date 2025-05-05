/*\
title: $:/plugins/flibbles/graph/widgets/edge.js
type: application/javascript
module-type: widget-subclass

Widget for creating edges within graphs.

\*/

"use strict";

var nextId = 1;

exports.baseClass = "graphobject";
exports.name = "edge";

exports.constructor = function(parseTreeNode, options) {
	this.initialise(parseTreeNode, options);
};

var EdgeWidget = exports.prototype = {};

EdgeWidget.graphObjectType = "edges";

EdgeWidget.execute = function() {
	this.id = this.getAttribute("$id");
	if (!this.id) {
		// We do this so we don't increment unecessarily, and maybe reuse
		// the same auto-id if this edge refreshes Self. This'll give better
		// results when updating the graph. It's a CHANGED edge, not a new one.
		this.counter = this.counter || nextId++;
		this.id = "edgeid-" + this.counter;
	}
	this.fromTiddler = this.getAttribute("$from", this.getVariable("currentTiddler"));
	this.toTiddler = this.getAttribute("$to", this.getVariable("toTiddler"));
	// We're new, so we're changed. Announce ourselves when asked.
	this.changed = true;
	this.makeChildWidgets();
};

EdgeWidget.setCustomProperties = function(properties) {
	if (this.fromTiddler) {
		properties.from = this.fromTiddler;
	}
	if (this.toTiddler) {
		properties.to = this.toTiddler;
	}
};
