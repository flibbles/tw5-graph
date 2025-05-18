/*\

Base-class widget that provides standard functionality for all "graph objects",
such as nodes or edges.

\*/

"use strict";

var Widget = require("$:/core/modules/widgets/widget.js").widget;

var ObjectWidget = function(parseTreeNode, options) {};

ObjectWidget.prototype = new Widget();

ObjectWidget.prototype.render = function(parent, nextSibling) {
	this.parentDomNode = parent;
	this.computeAttributes();
	this.execute();
	this.renderChildren(parent, nextSibling);
};

ObjectWidget.prototype.refresh = function(changedTiddlers) {
	var changedAttributes = this.computeAttributes();
	// TODO: This could be tightened if this.settings and this.object were combined, and we only detect actual differences.
	for (var attribute in changedAttributes) {
		this.refreshSelf();
		return true;
	}
	return this.refreshChildren(changedTiddlers);
};

ObjectWidget.prototype.allowActionPropagation = function() {
	return false;
};

ObjectWidget.prototype.getGraphObject = function(style) {
	return this.properties;
};

ObjectWidget.prototype.setProperties = function(parentProperties) {
	this.properties = $tw.utils.extend(Object.create(null), parentProperties);
	this.setCustomProperties(this.properties);
	for (var key in this.attributes) {
		if (key.charAt(0) !== "$") {
			var value = this.attributes[key];
			if (value) {
				this.properties[key] = this.attributes[key];
			}
		}
	}
};

ObjectWidget.prototype.catchGraphEvent = function(graphEvent, triggeringWidget, variables) {
	var actions = this.attributes[graphEvent.type];
	if (actions) {
		variables.targetTiddler = graphEvent.id;
		triggeringWidget.invokeActionString(actions, triggeringWidget, graphEvent.event, variables);
		return true;
	}
	return false;
};

exports.graphobject = ObjectWidget;
