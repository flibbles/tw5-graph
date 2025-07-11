/*\

Widget for creating nodes within graphs.

\*/

"use strict";

var axes = ['x', 'y', 'z', 'w'];

exports.baseClass = "graphobject";
exports.name = "node";

exports.constructor = function(parseTreeNode, options) {
	this.initialise(parseTreeNode, options);
};

var NodeWidget = exports.prototype = {};

NodeWidget.graphObjectType = "nodes";

NodeWidget.execute = function() {
	this.id = this.getAttribute("$tiddler", this.getVariable("currentTiddler"));
	this.pos = this.getAttribute("$pos");
	this.makeChildWidgets();
};

NodeWidget.addActionContext = function(variables) {
	variables.nodeTiddler = this.id;
};

NodeWidget.setCustomProperties = function(properties) {
	if (this.pos) {
		var points = this.pos.split(",");
		var count = Math.min(points.length, axes.length);
		for (var i = 0; i < count; i++) {
			if (points[i]) {
				properties[axes[i]] = points[i];
			}
		}
	}
};
