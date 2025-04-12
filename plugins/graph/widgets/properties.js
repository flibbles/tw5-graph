/*\
title: $:/plugins/flibbles/graph/widgets/properties.js
type: application/javascript
module-type: widget

Widget for setting properties on graph objects.

\*/

"use strict";

var Widget = require("$:/core/modules/widgets/widget.js").widget;

var Properties = function(parseTreeNode, options) {
	this.initialise(parseTreeNode, options);
};

Properties.prototype = new Widget();

Properties.prototype.render = function(parent, nextSibling) {
	this.parentDomNode = parent;
	this.computeAttributes();
	this.execute();
	this.renderChildren(parent, nextSibling);
};

Properties.prototype.execute = function() {
	this.type = this.getAttribute("$for", "nodes");
	this.filter = this.getAttribute("$filter");
	this.dataTiddler = this.getAttribute("$dataTiddler");
	this.filterFunc = this.filter? this.wiki.compileFilter(this.filter): function(source) { return source; };
	this.styleObject = this.createStyle();
	if (this.filter) {
		this.affectedObjects = Object.create(null);
	}
	this.knownObjects = {};
	this.makeChildWidgets();
};

Properties.prototype.refresh = function(changedTiddlers) {
	var changedAttributes = this.computeAttributes();
	var changed = false;
	if ($tw.utils.count(changedAttributes) > 0
	|| (this.dataTiddler && changedTiddlers[this.dataTiddler])) {
		// Our styling attributes have changed, so everything this $style
		// affects needs to refresh.
		this.dataTiddler = this.getAttribute("$dataTiddler");
		this.styleObject = this.createStyle();
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
			var shouldStyle = this.filterFunc([id], this).length > 0;
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

Properties.prototype.createStyle = function() {
	var styleObject = Object.create(null);
	if (this.dataTiddler) {
		var data = this.wiki.getTiddlerData(this.dataTiddler);
		$tw.utils.extend(styleObject, data);
	}
	for (var name in this.attributes) {
		if (name.charAt(0) !== '$' && this.attributes[name]) {
			styleObject[name] = this.attributes[name];
		}
	}
	return styleObject;
};

Properties.prototype.updateGraphWidgets = function(parentCallback) {
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
				if (self.filterFunc([id], self).length > 0) {
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
				widget.setProperties(callback(widget));
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

Properties.prototype.collectGraphProperties = function(properties) {
	var searchChildren = function(children) {
		for (var i = 0; i < children.length; i++) {
			var widget = children[i];
			if (widget.collectGraphProperties) {
				widget.collectGraphProperties(properties);
			} else if (widget.children) {
				searchChildren(widget.children);
			}
		}
	};
	searchChildren(this.children, null);
	if (this.type === "graph") {
		for (var style in this.styleObject) {
			properties[style] = this.styleObject[style];
		}
	}
};

exports.properties = Properties;
