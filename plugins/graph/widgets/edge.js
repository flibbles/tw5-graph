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
	this.id = nextId;
	nextId++;
};

EdgeWidget.prototype = new Widget();

EdgeWidget.prototype.render = function(parent, nextSibling) {
	this.parentDomNode = parent;
	this.computeAttributes();
	this.execute();
	this.renderChildren();
};

EdgeWidget.prototype.execute = function() {
	this.fromTiddler = this.getVariable("currentTiddler");
	this.toTiddler = this.getAttribute("to");
	this.label = this.getAttribute("label");
	// We're new, so we're changed. Announce ourselves when asked.
	this.changed = true;
	this.makeChildWidgets();
};

EdgeWidget.prototype.refresh = function(changedTiddlers) {
	var changedAttributes = this.computeAttributes();
	if (changedAttributes.label || changedAttributes.to) {
		this.refreshSelf();
		return true;
	}
	return this.refreshChildren(changedTiddlers);
};


EdgeWidget.prototype.getEdgeData = function() {
	if (this.changed) {
		this.changed = false;
		var data = {
			from: this.fromTiddler,
			to: this.toTiddler
		};
		if (this.label) {
			data.label = this.label;
		}
		return data;
	}
};

exports.edge = EdgeWidget;
