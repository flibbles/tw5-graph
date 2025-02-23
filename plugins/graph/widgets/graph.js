/*\
title: $:/plugins/flibbles/graph/widgets/graph.js
type: application/javascript
module-type: widget

Widget for creating graphs.

\*/

"use strict";

var Widget = require("$:/core/modules/widgets/widget.js").widget;
var utils = require("../utils.js");

var Engines = $tw.modules.applyMethods("graphengine");

var graphColors = {
	nodeBackground: "graph-node-background",
	nodeForeground: "graph-node-foreground"
};

var GraphWidget = function(parseTreeNode, options) {
	this.initialise(parseTreeNode, options);
};

/*
Inherit from the base widget class
*/
GraphWidget.prototype = new Widget();

/*
Render this widget into the DOM
*/
GraphWidget.prototype.render = function(parent, nextSibling) {
	this.parentDomNode = parent;
	this.computeAttributes();
	this.execute();
	this.graphElement = this.document.createElement("div");
	this.graphElement.className = "graph-canvas";
	this.graphElement.style.width = this.width;
	this.graphElement.style.height = this.height;
	this.domNodes.push(this.graphElement);

	parent.insertBefore(this.graphElement, nextSibling);
	this.renderChildren(this.graphElement, null);

	// Render and recenter the view
	if(this.engine) {
		this.engine.onevent = GraphWidget.prototype.handleEvent.bind(this);
		var objects = this.findGraphObjects() || {};
		objects.style = this.getStyleObject();
		this.engine.init(this.graphElement, objects);
	}
};

/*
Compute the internal state of the widget
*/
GraphWidget.prototype.execute = function() {
	this.colorWidgets = {};
	this.colors = {};
	this.engineValue = this.getEngineName();
	this.executeDimensions();
	var Engine = utils.getEngine(this.engineValue);
	if (!Engine) {
		var message;
		if (!this.engineValue) {
			message = "No graphing libraries installed.";
		} else if (this.getAttribute("$engine")) {
			message = "'" + this.engineValue + "' graphing library not found.";
		} else {
			message = "Graph plugin configured to use missing '" + this.engineValue + "' engine. Fix this in plugin settings.";
		}
		this.makeChildWidgets([{type: "text", text: message}]);
		this.engine = undefined;
	} else {
		// TODO: Not quite the correct call here. It should only executeColors
		this.refreshColors();
		var coreStyleNode = {
			type: "style",
			children: this.parseTreeNode.children
		};
		this.knownObjects = {};
		this.children = [this.makeChildWidget(coreStyleNode)];
		this.engine = new Engine(this.wiki);
	}
};

GraphWidget.prototype.executeDimensions = function() {
	this.width = this.getAttribute("$width", "");
	this.height = this.getAttribute("$height", "");
};

/*
Selectively refreshes the widget if needed. Returns true if the widget or any of its children needed re-rendering
*/
GraphWidget.prototype.refresh = function(changedTiddlers) {
	var changedAttributes = this.computeAttributes(),
		newEngineValue = this.getEngineName();
	if(changedAttributes["$engine"] || (this.engineValue !== newEngineValue)) {
		this.refreshSelf();
		return true;
	}
	var changed = false;
	var objects;
	for (var attribute in changedAttributes) {
		if (attribute === "$width" || attribute === "$height") {
			changed = true;
			this.executeDimensions();
			this.graphElement.style.width = this.width;
			this.graphElement.style.height = this.height;
		}
	}
	if (this.refreshChildren(changedTiddlers)) {
		// Children have changed. Look for changed nodes and edges.
		objects = this.findGraphObjects();
		changed = true;
	}
	if (this.refreshColors(changedTiddlers)) {
		objects = objects || {};
		objects.style = this.getStyleObject();
		changed = true;
	}
	if (objects) {
		this.engine.update(objects);
	}
	return changed;
};

GraphWidget.prototype.refreshColors = function(changedTiddlers) {
	var changed = false;
	for (var color in graphColors) {
		var widget = this.colorWidgets[color];
		if (!widget) {
			widget = this.colorWidgets[color] = this.wiki.makeWidget({
				tree: [{
					type: "transclude",
					attributes: {
						"$variable": {type: "string", value: "colour"},
						0: {type: "string", value: graphColors[color]}}
				}]}, {parentWidget: this});
		} else if (!widget.refresh(changedTiddlers)) {
			continue;
		}
		var container = $tw.fakeDocument.createElement("div");
		widget.render(container, null);
		this.colors[color] = container.textContent;
		changed = true;
	}
	return changed;
};

GraphWidget.prototype.getEngineName = function() {
	return this.getAttribute("$engine")
		|| this.wiki.getTiddlerText("$:/config/flibbles/graph/engine");
};

GraphWidget.prototype.getStyleObject = function() {
	return $tw.utils.extend({}, this.colors);
};

GraphWidget.prototype.findGraphObjects = function() {
	var self = this;
	var newObjects = this.children[0].updateGraphWidgets(
		function() {return {};},
		function(type, key, value) {
			var category = self.engine.properties[type];
			var info = category && category[key];
			if (info && info.type === "number") {
				value = parseFloat(value);
				if (info.min !== undefined && value < info.min) {
					value = info.min;
				}
				if (info.max !== undefined && value > info.max) {
					value = info.max;
				}
			}
			return value;
		}
	);
	// Special handling for edge trimming
	withholdObjects(newObjects);
	var prevObjects = this.knownObjects;
	this.knownObjects = newObjects;
	return getDifferences(prevObjects, newObjects);
};

function withholdObjects(objects) {
	// Special handling for edge trimming
	if (objects.edges) {
		for (var id in objects.edges) {
			var edge = objects.edges[id];
			// This could probably be done above when deleting nulls
			if (!objects.nodes
			|| !objects.nodes[edge.fromTiddler]
			|| !objects.nodes[edge.toTiddler]) {
				// It must be trimmed
				objects.edges[id] = undefined;
			}
		}
	}
};

function getDifferences(prevObjects, newObjects) {
	var objects = null
	for (var type in prevObjects) {
		var was = prevObjects[type];
		var is = newObjects[type];
		for (var id in was) {
			if (was[id]) {
				if (!is || !is[id]) {
					// It Was, and no longer Is. Flag for deletion
					objects = objects || {};
					objects[type] = objects[type] || Object.create(null);
					objects[type][id] = null;
				} else if (is[id].changed) {
					// It changed. updated it.
					objects = objects || {};
					objects[type] = objects[type] || Object.create(null);
					objects[type][id] = is[id].getGraphObject();
					is[id].changed = false;
				}
			}
		}
	}
	for (var type in newObjects) {
		var was = prevObjects? prevObjects[type]: undefined;
		var is = newObjects[type];
		for (var id in is) {
			if (is[id] && (!was || !was[id])) {
				// It has been added. Add it.
				objects = objects || {};
				objects[type] = objects[type] || Object.create(null);
				objects[type][id] = is[id].getGraphObject();
				is[id].changed = false;
			}
		}
	}
	return objects;
};

GraphWidget.prototype.handleEvent = function(params) {
	var object = params.id? this.knownObjects[params.objectType][params.id]: this;
	if (params.type === "doubleclick") {
		this.setVariable("point", params.point.x + "," + params.point.y);
		this.setVariable("viewPoint", params.viewPoint.x + "," + params.viewPoint.y);
		object.invokeActions(this, params);
	} else {
		// Start at the object. Go up, finding any $graphevents to handle this
		while (!object.catchGraphEvent || !object.catchGraphEvent(params)) {
			object = object.parentWidget;
		}
	}
};

GraphWidget.prototype.catchGraphEvent = function(params) {
	// This catches all uncaught events
	return true;
};

exports.graph = GraphWidget;
