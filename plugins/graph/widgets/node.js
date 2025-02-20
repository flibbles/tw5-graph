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
	this.id = this.getAttribute("$tiddler", this.getVariable("currentTiddler"));
	this.pos = this.getAttribute("$pos");
	this.settings = Object.create(null);
	for (var key in this.attributes) {
		if (key.charAt(0) !== "$") {
			var value = this.attributes[key];
			if (value) {
				this.settings[key] = this.attributes[key];
			}
		}
	}
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
	return this.object;
};

/* When testing applicability in a $style filter, use the tiddler title
 * as the input source.
 */
NodeWidget.prototype.getGraphFilterSource = function() {
	return [this.id];
}

NodeWidget.prototype.setStyle = function(data) {
	if (this.pos) {
		var points = this.pos.split(",");
		data.x = parseFloat(points[0]);
		data.y = parseFloat(points[1]);
	}
	this.object = $tw.utils.extend(data, this.settings);
};

exports.node = NodeWidget;
