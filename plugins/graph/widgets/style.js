/*\
title: $:/plugins/flibbles/graph/widgets/style.js
type: application/javascript
module-type: widget

Widget for setting styles on graph objects.

\*/

"use strict";

var Widget = require("$:/core/modules/widgets/widget.js").widget;

var StyleWidget = function(parseTreeNode, options) {
	this.initialise(parseTreeNode, options);
};

StyleWidget.prototype = new Widget();

StyleWidget.prototype.render = function(parent, nextSibling) {
	this.parentDomNode = parent;
	this.computeAttributes();
	this.execute();
	this.renderChildren(parent, nextSibling);
};

StyleWidget.prototype.execute = function() {
	this.type = this.getAttribute("$for", "nodes");
	this.filter = this.getAttribute("$filter");
	this.filterFunc = this.filter? this.wiki.compileFilter(this.filter): function(source) { return source; };
	this.styleObject = this.createStyleFromAttributes(this.attributes);
	if (this.filter) {
		this.affectedObjects = Object.create(null);
	}
	this.knownObjects = {};
	this.makeChildWidgets();
};

StyleWidget.prototype.refresh = function(changedTiddlers) {
	var changedAttributes = this.computeAttributes();
	var changed = false;
	if ($tw.utils.count(changedAttributes) > 0) {
		// Our styling attributes have changed, so everything this $style
		// affects needs to refresh.
		this.styleObject = this.createStyleFromAttributes(this.attributes);
		for (var id in this.affectedObjects || this.knownObjects[this.type]) {
			this.knownObjects[this.type][id].changed = true;
		}
		changed = true;
	}
	// If the $for changed, we need to refocus to the different object type.
	if (changedAttributes["$for"]) {
		this.type = this.getAttribute("$for", "nodes");
		if (this.filter) {
			this.affectedObjects = Object.create(null);
		} else {
			// We need to notify all objects of the new category to refresh.
			for (var id in this.knownObjects[this.type]) {
				this.knownObjects[this.type][id].changed = true;
			}
		}
	}
	// If we have a filterFunc, we need to worry about whether this style
	// applies to a different subset of its children objects or not.
	// TODO: A full refresh is not required, even if the filter changes
	if (this.filter) {
		var known = this.knownObjects[this.type];
		for (var id in known) {
			var widget = known[id];
			var source = widget.getGraphFilterSource();
			var shouldStyle = this.filterFunc(source).length > 0;
			if (shouldStyle !== !!this.affectedObjects[id]) {
				// We're changing whether we style it or not. And also that
				// object will need to resubmit its info to the graph.
				this.affectedObjects[id] = shouldStyle;
				widget.changed = true;
				changed = true;
			}
		}
	}
	return this.refreshChildren(changedTiddlers) || changed;
};

StyleWidget.prototype.createStyleFromAttributes = function(attributes) {
	var styleObject = Object.create(null);
	for (var name in attributes) {
		if (name.charAt(0) !== '$' && attributes[name]) {
			styleObject[name] = attributes[name];
		}
	}
	return styleObject;
};

StyleWidget.prototype.updateGraphWidgets = function(parentCallback) {
	var self = this;
	var newObjects = {};
	var callback = function(widget) {
		var type = widget.graphObjectType;
		var id = widget.id;
		newObjects[type] = newObjects[type] || Object.create(null);
		newObjects[type][id] = widget;
		var object = parentCallback(widget);
		if (type === self.type) {
			if (self.filter) {
				var source = widget.getGraphFilterSource();
				if (self.filterFunc(source).length > 0) {
					self.affectedObjects[id] = true;
				} else {
					return object;
				}
			}
			for (var style in self.styleObject) {
				object[style] = self.styleObject[style];
			}
		}
		return object;
	};
	var searchChildren = function(children) {
		for (var i = 0; i < children.length; i++) {
			var widget = children[i];
			if (widget.graphObjectType) {
				widget.setStyle(callback(widget));
			}
			if (widget.updateGraphWidgets) {
				widget.updateGraphWidgets(callback);
			} else if (widget.children) {
				searchChildren(widget.children);
			}
		}
	};
	searchChildren(this.children, null);
	this.knownObjects = newObjects;
	return newObjects;
};

exports.style = StyleWidget;
