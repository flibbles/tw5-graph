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

EdgeWidget.prototype.graphObjectType = "edges";

EdgeWidget.prototype.render = function(parent, nextSibling) {
	this.parentDomNode = parent;
	this.computeAttributes();
	this.execute();
	this.renderChildren(parent, nextSibling);
};

EdgeWidget.prototype.execute = function() {
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

EdgeWidget.prototype.refresh = function(changedTiddlers) {
	var changedAttributes = this.computeAttributes();
	// TODO: This could be tightened if this.settings and this.object were combined, and we only detect actual differences.
	for (var attribute in changedAttributes) {
		this.refreshSelf();
		return true;
	}
	return this.refreshChildren(changedTiddlers);
};

EdgeWidget.prototype.allowActionPropagation = function() {
	return false;
};

EdgeWidget.prototype.getGraphObject = function() {
	this.changed = false;
	return this.properties;
};

EdgeWidget.prototype.setProperties = function(parentProperties) {
	this.properties = $tw.utils.extend(Object.create(null), parentProperties);
	for (var key in this.attributes) {
		if (key.charAt(0) !== "$") {
			var value = this.attributes[key];
			if (value) {
				this.properties[key] = value;
			}
		}
	}
	if (this.fromTiddler) {
		this.properties.from = this.fromTiddler;
	}
	if (this.toTiddler) {
		this.properties.to = this.toTiddler;
	}
};

EdgeWidget.prototype.catchGraphEvent = function(graphEvent, variables) {
	var actions = this.properties[graphEvent.type];
	if (actions) {
		variables.targetTiddler = graphEvent.id;
		this.invokeActionString(actions, this, graphEvent.event, variables);
		return true;
	}
	return false;
};

exports.edge = EdgeWidget;
