/*\

Base-class widget that provides standard functionality for all "graph objects",
such as nodes or edges.

\*/

"use strict";

var Widget = require("$:/core/modules/widgets/widget.js").widget;
var utils = require("../utils.js");

var ObjectWidget = function(parseTreeNode, options) {};

ObjectWidget.prototype = new Widget();

// Graph object widgets are a type of property holder.
Object.assign(ObjectWidget.prototype, utils.PropertyHolder);

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
	|| this.refreshProperties(changedTiddlers)) {
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

/*
Can be overriden to allow object types to set properties based on rules
and behaviors specific to that typeA.
*/
ObjectWidget.prototype.setCustomProperties = function(properties, rules) {};

/*
This is an opportunity for a graphObject to evaluate itself in relation with
all other collected graph objects, as well as knowing its own relative index.
It can use this opportunity to flag itself as needing refreshing, or
return true to indicate it should be pruned away as an illegal object.
*/
ObjectWidget.prototype.curate = function(objects, index) { return false; };

/*
Calculates and stores the properties raw values in the object.
Then returns the evaluated property values to be used by the engine.
*/
ObjectWidget.prototype.calculatePropertyValues = function(rules) {
	return this.evaluateProperties(this.computeProperties(rules), rules);
};

/*
Computes the properties for this object and returns them in an object.
*/
ObjectWidget.prototype.computeProperties = function(rules) {
	var newProperties = Object.create(null);
	// First, we set any auto-properties, so that anything else
	// will have the opportunity to override them.
	for (var name in rules) {
		var property = rules[name];
		// It's flagged to always be sent to the engine.
		// Send along the default value. It may be overridden momentarily.
		if (property.always) {
			newProperties[name] = property.default;
		}
	}
	// Then we travel down and set properties based on containing
	// $property widgets.
	for (var i = this.applicableParents.length-1; i >= 0; i--) {
		var widget = this.applicableParents[i];
		for (var property in widget.properties) {
			newProperties[property] = widget.properties[property];
		}
	}
	// Then object types get a chance to set properties based on
	// their own unique rules.
	this.setCustomProperties(newProperties, rules);
	// Then we set properties based on explicit attributes
	// on this object. These take highest priority.
	for (var key in this.attributes) {
		if (key.charAt(0) !== "$") {
			var value = this.attributes[key];
			if (value) {
				newProperties[key] = this.attributes[key];
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
