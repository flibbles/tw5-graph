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
};

ObjectWidget.prototype.refresh = function(changedTiddlers) {
	var changedAttributes = this.computeAttributes();
	// Did our parents experience a change to their properties?
	if (this.computeParents()
	// Did our own property attribute change obviously?
	|| $tw.utils.count(changedAttributes) > 0
	// Were the properties cleared because they were stale?
	|| !this.properties
	// maybe properties changed covertly... (expensive)
	|| utils.refreshProperties(this.properties, this, this.graphObjectType, changedTiddlers)) {
		this.execute();
		// They'll need to be refreshed
		this.properties = null;
	}
	// Then we give our children a chance to refresh too
	return this.refreshChildren(changedTiddlers) || !this.properties;
};

ObjectWidget.prototype.allowActionPropagation = function() {
	return false;
};

// By default, an object widget is always legal.
// Specific types can define their own reasons why objects should be filtered.
ObjectWidget.prototype.isDisqualified = function() { return false; };

/**
 * Computes the properties for this object and returns them in an object.
 */
ObjectWidget.prototype.computeProperties = function() {
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
