/*\
title: $:/plugins/flibbles/graph/utils.js
type: application/javascript
module-type: library

Utility methods used by the graphing widgets.

\*/

"use strict";

var Engines = $tw.modules.createClassesFromModules("graphengine");
var PropertyTypes = $tw.modules.getModulesByTypeAsHashmap("graphpropertytype");

/*
Returns the window for flibbles/graph to use. I do this so that the testing
framework can mock it out on Node.JS.
*/
exports.window = function() { return window; };

exports.getEngineMap = function() {
	return Engines;
};

exports.getEngine = function(name) {
	var engineMap = exports.getEngineMap();
	if (name) {
		return engineMap[name] || null;
	}
	for (var entry in engineMap) {
		// take the first one
		return engineMap[entry];
	}
	return null;
};

/*
Checks if any property in an object needs to check for refresh, and returns
true if any do need to refresh.
*/
exports.refreshProperties = function(properties, widget, type, changedTiddlers) {
	var engineName = widget.getVariable("graphengine");
	var engine = Engines[engineName];
	if (engine) {
		var propInfos = engine.prototype.properties[type];
		if (propInfos) {
			for (var name in properties) {
				var info = propInfos[name];
				var type = PropertyTypes[info && info.type];
				if (type && type.refresh) {
					if (type.refresh(info,
							properties[name],
							changedTiddlers, {wiki: widget.wiki})) {
						return true;
					}
				}
			}
		}
	}
	return false;
};

// Aren't we all eventually garbage?
var eventualGarbage = [];
var upkeepId;

/*
Register an object for destruction. It's ready to pass on once its
isGarbage method returns true;
*/
exports.registerForDestruction = function(object) {
	if (!upkeepId) {
		upkeepId = setInterval(exports.upkeep, 5000);
	}
	eventualGarbage.push(object);
};

exports.upkeep = function() {
	var i = eventualGarbage.length;
	while (i > 0) {
		i--;
		var object = eventualGarbage[i];
		if (object.isGarbage()) {
			eventualGarbage.splice(i, 1);
			object.destroy();
		}
	}
	// No managed objects. Let's shut down for now.
	if (eventualGarbage.length == 0) {
		clearInterval(upkeepId);
		upkeepId = null;
	}
};

exports.getParentProperties = function(widget, type) {
	// For now, we hard-stop at the graph. We don't take properties outside
	// We may some day, but for now, support for that would be frought with
	// complications
	while (widget.parentWidget && widget.graphObjectType !== "graph") {
		widget = widget.parentWidget;
		if (widget.graphPropertiesWidget && widget.type === type) {
			return widget;
		}
	};
	return null;
};

exports.WidgetIterator = function(root) {
	this.stack = [];
	this.ptr = root;
	while (this.ptr.children && this.ptr.children.length > 0) {
		this.stack.push(0);
		this.ptr = this.ptr.children[0];
	}
};

exports.WidgetIterator.prototype.next = function() {
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
