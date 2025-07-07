/*\

Base-class widget that provides standard functionality for all "graph objects",
such as nodes or edges.

\*/

"use strict";

var Widget = require("$:/core/modules/widgets/widget.js").widget;
var utils = require("../utils.js");

var ObjectWidget = function(parseTreeNode, options) {};

ObjectWidget.prototype = new Widget();

ObjectWidget.prototype.render = function(parent, nextSibling) {
	this.parentDomNode = parent;
	this.parentPropertiesWidget = utils.getParentProperties(this, this.graphObjectType);
	this.computeAttributes();
	this.execute();
	this.refreshApplicableParents();
	this.renderChildren(parent, nextSibling);
	// We're new, so we're changed. Announce ourselves when asked.
	this.changed = true;
};

ObjectWidget.prototype.refresh = function(changedTiddlers) {
	var changedAttributes = this.computeAttributes();
	for (var attribute in changedAttributes) {
		this.refreshSelf();
		return true;
	}
	// No properties have overtly changed, but maybe they changed covertly...
	if (utils.refreshProperties(this.properties, this, this.graphObjectType, changedTiddlers)) {
		this.refreshSelf();
		return true;
	}
	if (this.refreshApplicableParents()) {
		this.refreshSelf();
		return true;
	}
	return this.refreshChildren(changedTiddlers);
};

ObjectWidget.prototype.allowActionPropagation = function() {
	return false;
};

ObjectWidget.prototype.getProperties = function() {
	this.properties = Object.create(null);
	this.setCustomProperties(this.properties);
	for (var key in this.attributes) {
		if (key.charAt(0) !== "$") {
			var value = this.attributes[key];
			if (value) {
				this.properties[key] = this.attributes[key];
			}
		}
	}
	for (var i = 0; i < this.applicableParents.length; i++) {
		var widget = this.applicableParents[i];
		for (var property in widget.properties) {
			if (!Object.hasOwnProperty.call(this.properties, property)) {
				this.properties[property] = widget.properties[property];
			}
		}
	}
	this.changed = false;
	return this.properties;
};

ObjectWidget.prototype.catchGraphEvent = function(graphEvent, triggeringWidget, variables) {
	var actions = this.attributes[graphEvent.type];
	if (actions) {
		triggeringWidget.invokeActionString(actions, triggeringWidget, graphEvent.event, variables);
		return true;
	}
	return false;
};

ObjectWidget.prototype.refreshApplicableParents = function() {
	var parent = this.parentPropertiesWidget;
	var index = 0;
	var changed = false;
	this.applicableParents = this.applicableParents || [];
	while (parent !== null) {
		if (parent.filterFunc([this.id], parent).length > 0) {
			if (this.applicableParents[index] !== parent) {
				this.applicableParents[index] = parent;
				changed = true;
			} else if (parent.propertiesChanged) {
				changed = true;
			}
			index++;
		}
		parent = parent.parentPropertiesWidget;
	}
	if (index !== this.applicableParents.length) {
		this.applicableParents.length = index;
		changed = true;
	}
	return changed;
};

exports.graphobject = ObjectWidget;
