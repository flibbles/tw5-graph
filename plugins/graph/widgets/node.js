/*\
title: $:/plugins/flibbles/graph/widgets/node.js
type: application/javascript
module-type: widget

Widget for creating nodes within graphs.

\*/

"use strict";

var axes = ['x', 'y', 'z', 'w'];

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
	this.id = this.getAttribute("$tiddler", this.getVariable("currentTiddler"));
	this.pos = this.getAttribute("$pos");
	// We're new, so we're changed. Announce ourselves when asked.
	this.changed = true;
	this.makeChildWidgets();
};

NodeWidget.prototype.refresh = function(changedTiddlers) {
	var changedAttributes = this.computeAttributes();
	// TODO: This could be tightened if this.settings and this.object were combined, and we only detect actual differences.
	for (var attribute in changedAttributes) {
		this.refreshSelf();
		return true;
	}
	return this.refreshChildren(changedTiddlers);
};

NodeWidget.prototype.allowActionPropagation = function() {
	return false;
};

NodeWidget.prototype.getGraphObject = function(style) {
	return this.properties;
};

NodeWidget.prototype.setProperties = function(parentProperties) {
	this.properties = $tw.utils.extend(Object.create(null), parentProperties);
	if (this.pos) {
		var points = this.pos.split(",");
		var count = Math.min(points.length, axes.length);
		for (var i = 0; i < count; i++) {
			if (points[i]) {
				this.properties[axes[i]] = points[i];
			}
		}
	}
	for (var key in this.attributes) {
		if (key.charAt(0) !== "$") {
			var value = this.attributes[key];
			if (value) {
				this.properties[key] = this.attributes[key];
			}
		}
	}
};

NodeWidget.prototype.catchGraphEvent = function(graphEvent, triggeringWidget, variables) {
	var actions = this.attributes[graphEvent.type];
	if (actions) {
		variables.targetTiddler = graphEvent.id;
		triggeringWidget.invokeActionString(actions, triggeringWidget, graphEvent.event, variables);
		return true;
	}
	return false;
};

exports.node = NodeWidget;
