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
var PropertyTypes = $tw.modules.getModulesByTypeAsHashmap("graphpropertytype");

var graphColors = {
	nodeColor: "graph-node-color",
	fontColor: "graph-font-color"
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
	var className = "graph-canvas";
	if (!this.engine) {
		className += " graph-error";
	}
	this.graphElement.className = className;
	if (this.width) {
		this.graphElement.style.width = this.width;
	}
	if (this.height) {
		this.graphElement.style.height = this.height;
	}
	this.domNodes.push(this.graphElement);

	parent.insertBefore(this.graphElement, nextSibling);
	this.renderChildren(this.graphElement, null);

	// Render and recenter the view
	if(this.engine) {
		this.engine.onevent = GraphWidget.prototype.handleEvent.bind(this);
		var objects = this.findGraphObjects() || {};
		objects.graph = this.getViewSettings();
		try {
			this.engine.init(this.graphElement, objects);
		} catch(e) {
			// Something went wrong. Rebuild this widget as an error displayer
			console.error(e);
			this.errorState = e.message || e.toString();
			this.refreshSelf();
		}
	}
};

/*
Compute the internal state of the widget
*/
GraphWidget.prototype.execute = function() {
	this.colorWidgets = {};
	this.engineValue = this.getEngineName();
	this.executeDimensions();
	this.executeColors();
	var Engine = utils.getEngine(this.engineValue);
	if (!Engine || this.errorState) {
		var message;
		if (this.errorState) {
			message = this.errorState;
			this.errorState = null;
		} else if (!this.engineValue) {
			message = "No graphing libraries installed.";
		} else if (this.getAttribute("$engine")) {
			message = "'" + this.engineValue + "' graphing library not found.";
		} else {
			message = "Graph plugin configured to use missing '" + this.engineValue + "' engine. Fix this in plugin settings.";
		}
		this.makeChildWidgets([{type: "element", tag: "span", children: [{type: "text", text: message}]}]);
		this.engine = undefined;
	} else {
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
		newEngineValue = this.getEngineName(),
		viewChanged = false;
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
		if (attribute.charAt(0) !== "$") {
			viewChanged = true;
		}
	}
	if (this.refreshChildren(changedTiddlers)) {
		// Children have changed. Look for changed nodes and edges.
		objects = this.findGraphObjects();
		changed = true;
	}
	if (viewChanged || this.refreshColors(changedTiddlers)) {
		objects = objects || {};
		objects.graph = this.getViewSettings();
		changed = true;
	}
	if (changed) {
		if (!this.engine) {
			// We were in an error state. Maybe we won't be after refreshing.
			this.refreshSelf();
		} else if (objects) {
			try {
				this.engine.update(objects);
			} catch (e) {
				// Something went wrong. Rebuild this widget as an error displayer
				console.error(e);
				this.errorState = e.message || e.toString();
				this.refreshSelf();
			}
		}
	}
	return changed;
};

GraphWidget.prototype.refreshColors = function(changedTiddlers) {
	var changed = false;
	for (var color in graphColors) {
		if (!this.colorWidgets[color].refresh(changedTiddlers)) {
			continue;
		}
		changed = true;
	}
	return changed;
};

GraphWidget.prototype.executeColors = function() {
	for (var color in graphColors) {
		this.colorWidgets[color] = this.wiki.makeWidget({
			tree: [{
				type: "transclude",
				attributes: {
					"$variable": {type: "string", value: "colour"},
					0: {type: "string", value: graphColors[color]}}
			}]}, {parentWidget: this});
	}
};

GraphWidget.prototype.getEngineName = function() {
	return this.getAttribute("$engine")
		|| this.wiki.getTiddlerText("$:/config/flibbles/graph/engine");
};

GraphWidget.prototype.getViewSettings = function() {
	var settings = Object.create(null);
	if (this.engine) {
		for (var color in graphColors) {
			var widget = this.colorWidgets[color];
			var container = $tw.fakeDocument.createElement("div");
			widget.render(container, null);
			var content = container.textContent;
			if (content) {
				settings[color] = content;
			}
		}
		for (var name in this.attributes) {
			if (name.charAt(0) !== '$' && this.attributes[name]) {
				settings[name] = this.transformProperty("graph", name, this.attributes[name]);
			}
		}
	}
	return settings;
};

GraphWidget.prototype.transformProperty = function(type, key, value) {
	var category = this.engine.properties[type];
	var info = category && category[key];
	if (info && PropertyTypes[info.type]) {
		return PropertyTypes[info.type].toProperty(info, value);
	}
	return value;
};

GraphWidget.prototype.findGraphObjects = function() {
	var self = this;
	var newObjects = this.children[0].updateGraphWidgets(
		function() {return {};},
		function(type, key, value) {
			return self.transformProperty(type, key, value);
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
