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
	this.computeParents();
	this.renderChildren(parent, nextSibling);
	this.properties = this.refreshProperties();
	// We're new, so we're changed. Announce ourselves when asked.
	this.changed = true;
};

ObjectWidget.prototype.refresh = function(changedTiddlers) {
	var changedAttributes = this.computeAttributes();
	// Did our parents experience a change?
	var possibleChanges = this.computeParents();
	// Did our own properties change?
	for (var attribute in changedAttributes) {
		possibleChanges = true;
	}
	// No properties have overtly changed, but maybe they changed covertly...
	if (!possibleChanges && utils.refreshProperties(this.properties, this, this.graphObjectType, changedTiddlers)) {
		possibleChanges = true;
		// We short-circuit this because we have a property that said it's for
		// sure different.
		this.changed = true;
	}
	if (possibleChanges) {
		this.execute();
		this.properties = this.refreshProperties();
		this.changed = true;
	}
	return this.refreshChildren(changedTiddlers) || this.changed;
};

ObjectWidget.prototype.allowActionPropagation = function() {
	return false;
};

ObjectWidget.prototype.refreshProperties = function() {
	var newProperties = Object.create(null);
	this.setCustomProperties(newProperties);
	for (var key in this.attributes) {
		if (key.charAt(0) !== "$") {
			var value = this.attributes[key];
			if (value) {
				newProperties[key] = this.attributes[key];
			}
		}
	}
	for (var i = 0; i < this.applicableParents.length; i++) {
		var widget = this.applicableParents[i];
		for (var property in widget.properties) {
			if (!Object.hasOwnProperty.call(newProperties, property)) {
				newProperties[property] = widget.properties[property];
			}
		}
	}
	return newProperties;
};

ObjectWidget.prototype.catchGraphEvent = function(graphEvent, triggeringWidget, variables) {
	var actions = this.attributes[graphEvent.type];
	if (actions) {
		triggeringWidget.invokeActionString(actions, triggeringWidget, graphEvent.event, variables);
		return true;
	}
	return false;
};

ObjectWidget.prototype.computeParents = function() {
	var index = 0;
	var changed = false;
	var list = this.applicableParents = this.applicableParents || [];
	this.traversePropertyWidgets(function(widget) {
		if (list[index] !== widget) {
			list[index] = widget;
			changed = true;
		} else if (widget.propertiesChanged) {
			changed = true;
		}
		index++;
	});
	if (index !== list.length) {
		list.length = index;
		changed = true;
	}
	return changed;
};

/**
 * Explore for any $properties which might apply to this. Can be overridden.
 */
ObjectWidget.prototype.traversePropertyWidgets = function(method) {
	var widget = this.parentPropertiesWidget;
	while (widget !== null) {
		if (widget.filterFunc([this.id], widget).length > 0) {
			method(widget);
		}
		widget = widget.parentPropertiesWidget;
	}
};

exports.graphobject = ObjectWidget;
