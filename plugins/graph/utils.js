/*\
title: $:/plugins/flibbles/graph/utils.js
type: application/javascript
module-type: library

Utility methods used by the graphing widgets.

\*/

"use strict";

var Engines = $tw.modules.createClassesFromModules("graphengine");

$tw.modules.applyMethods("graphutils", exports);

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
	return engineMap[name] || null;
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

/*** Destructor methods ***/

// Aren't we all eventually garbage?
var eventualGarbage = [];
var upkeepId;

/*
Register an object for destruction. It's ready to pass on once its
isGarbage method returns true;

object requirements:
.garbageCollect()
.isGarbage() => true/false
*/
exports.registerForGarbageCollection = function(object) {
	var destroy = object.destroy;
	if (destroy) {
		// This object has a destroy method, which means it's probably
		// a widget in ^v5.4.0 TiddlyWiki, which are capable of
		// destruction. We'll use that system instead. It's better.
		object.destroy = function() {
			// Call the widget core destroy method
			destroy.apply(object, arguments);
			// And then our own method
			object.garbageCollect();
		};
	} else {
		// Otherwise, we'll need to keep tabs on this so we can check
		// back in occasionally to see if it should be destroyed.
		if (!upkeepId) {
			upkeepId = setInterval(exports.upkeep, 5000);
		}
		eventualGarbage.push(object);
	}
};

exports.upkeep = function() {
	var i = eventualGarbage.length;
	while (i > 0) {
		i--;
		var object = eventualGarbage[i];
		if (object.isGarbage()) {
			eventualGarbage.splice(i, 1);
			object.garbageCollect();
		}
	}
	// No managed objects. Let's shut down for now.
	if (eventualGarbage.length == 0) {
		clearInterval(upkeepId);
		upkeepId = null;
	}
};
