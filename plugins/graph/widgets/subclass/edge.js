/*\

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
		// We do this instead of using getAttribute's default arg
		// so we don't increment unecessarily, and maybe reuse
		// the same auto-id if this edge refreshes Self. This'll give better
		// results when updating the graph. It's a CHANGED edge, not a new one.
		this.counter = this.counter || nextId++;
		this.id = "$:/edge/" + this.counter;
	}
	this.fromTiddler = this.getAttribute("$from", this.getVariable("currentTiddler"));
	this.toTiddler = this.getAttribute("$to", this.getVariable("toTiddler"));
	this.makeChildWidgets();
};

EdgeWidget.addActionContext = function(variables) {
	variables.id = this.id;
	variables.fromTiddler = this.fromTiddler;
	variables.toTiddler = this.toTiddler;
};

EdgeWidget.setCustomProperties = function(properties) {
	if (this.fromTiddler) {
		properties.from = this.fromTiddler;
	}
	if (this.toTiddler) {
		properties.to = this.toTiddler;
	}
};
