/*\

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
	this.field = this.getAttribute("$field", "text");
	this.filterFunc = this.filter? this.wiki.compileFilter(this.filter): function(source) { return source; };
	this.styleObject = this.createStyle();
	this.affectedObjects = Object.create(null);
	this.knownObjects = {};
	this.makeChildWidgets();
};

Properties.prototype.refresh = function(changedTiddlers) {
	var changedAttributes = this.computeAttributes();
	var changed = false;
	if (propertiesChanged(changedAttributes)
	|| changedAttributes["$dataTiddler"]
	|| changedAttributes["$field"]
	|| changedAttributes["$for"]
	|| (this.dataTiddler && changedTiddlers[this.dataTiddler])) {
		// Our styling attributes have changed, so everything this $style
		// affects needs to refresh.
		this.dataTiddler = this.getAttribute("$dataTiddler");
		this.field = this.getAttribute("$field", "text");
		this.styleObject = this.createStyle();
		var known = this.knownObjects[this.type];
		for (var id in this.affectedObjects || known) {
			known[id].changed = true;
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
	if (changedAttributes["$filter"]) {
		this.filter = this.getAttribute("$filter");
		this.filterFunc = this.filter? this.wiki.compileFilter(this.filter): function(source) { return source; };
	}
	if (this.filter || changedAttributes["$filter"]) {
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
		var data;
		if (this.field === "text") {
			data = this.wiki.getTiddlerData(this.dataTiddler);
		} else {
			data = this.wiki.getTiddler(this.dataTiddler).fields[this.field];
			data = JSON.parse(data);
		}
		for (var entry in data) {
			// We only accept non-empty values
			if (data[entry]) {
				styleObject[entry] = data[entry];
			}
		}
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
	var newAffected = Object.create(null);
	var callback = function(widget) {
		var type = widget.graphObjectType;
		var id = widget.id;
		newObjects[type] = newObjects[type] || Object.create(null);
		newObjects[type][id] = widget;
		var object = parentCallback(widget);
		if (type === self.type) {
			if (self.filterFunc([id], self).length > 0) {
				newAffected[id] = true;
			} else {
				return object;
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
	this.affectedObjects = newAffected;
	return newObjects;
};

Properties.prototype.collectGraphProperties = function(properties) {
	var iterator = new WidgetIterator(this);
	var results;
	while (!(results = iterator.next()).done) {
		var widget = results.value;
		if (widget.type === "graph") {
			for (var style in widget.styleObject) {
				properties[style] = widget.styleObject[style];
			}
		}
	}
};

Properties.prototype.catchGraphEvent = function(graphEvent, triggeringWidget, variables) {
	if (graphEvent.objectType === this.type && this.affectedObjects[graphEvent.id]) {
		var actions = this.styleObject[graphEvent.type];
		if (actions) {
			variables.targetTiddler = graphEvent.id;
			triggeringWidget.invokeActionString(actions, triggeringWidget, graphEvent.event, variables);
			return true;
		}
	}
	return false;
};

Properties.prototype.invokeGraphActions = function(graphEvent, variables) {
	var iterator = new WidgetIterator(this);
	var results;
	while (!(results = iterator.next()).done) {
		var widget = results.value;
		if (widget.type === "graph") {
			var actions = widget.styleObject[graphEvent.type];
			if (actions) {
				widget.invokeActionString(actions, widget, graphEvent.event, variables);
			}
		}
	}
};

function propertiesChanged(changedAttributes) {
	for (var name in changedAttributes) {
		if (name.charAt(0) !== "$") {
			return true;
		}
	}
	return false;
};

function WidgetIterator(root) {
	this.stack = [];
	this.ptr = root;
	while (this.ptr.children && this.ptr.children.length > 0) {
		this.stack.push(0);
		this.ptr = this.ptr.children[0];
	}
};

WidgetIterator.prototype.next = function() {
	var rtn, ptr = this.ptr;
	if (!ptr) {
		rtn = {done: true};
	} else {
		rtn = {value: ptr, done: false};
		ptr = ptr.parentWidget;
		var index = this.stack.pop();
		if (index !== undefined) {
			index++;
			if (ptr && ptr.children.length > index) {
				ptr = ptr.children[index];
				this.stack.push(index);
				// Now dive to the lowest child
				while (ptr.children && ptr.children.length > 0) {
					this.stack.push(0);
					ptr = ptr.children[0];
				}
			}
		} else {
			ptr = null;
		}
	}
	this.ptr = ptr;
	return rtn;
};


exports.properties = Properties;
