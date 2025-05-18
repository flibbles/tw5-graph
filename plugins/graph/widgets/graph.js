/*\

Widget for creating graphs.

\*/

"use strict";

var Widget = require("$:/core/modules/widgets/widget.js").widget;
var utils = require("../utils.js");

var Engines = $tw.modules.applyMethods("graphengine");
var PropertyTypes = $tw.modules.getModulesByTypeAsHashmap("graphpropertytype");

var graphColors = {
	nodeColor: "graph-node-color",
	fontColor: "graph-font-color",
	// We pass along the background too, even though it's probably covered
	// by CSS. Some engines might need this for other coloring effects.
	graphColor: "graph-background"
};

var GraphWidget = function(parseTreeNode, options) {
	this.initialise(parseTreeNode, options);
	utils.registerForDestruction(this);
	this.window = utils.window();
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
	var style = this.graphElement.style;
	if (this.graphWidth) {
		style.width = this.graphWidth;
	}
	if (this.graphHeight) {
		style.height = this.graphHeight;
	}
	this.domNodes.push(this.graphElement);
	parent.insertBefore(this.graphElement, nextSibling);
	this.renderChildren(this.graphElement, null);

	// Render and recenter the view
	if(this.engine) {
		this.engine.onevent = GraphWidget.prototype.handleEvent.bind(this);
		var objects = this.findGraphObjects() || {};
		this.properties = this.getViewSettings() || {};
		objects.graph = this.typecastProperties(this.properties, "graph");
		try {
			this.engine.init(this.graphElement, objects);
		} catch(e) {
			// Technically, we should drop this engine without destroying it.
			// It didn't successfully init, so it's not initialized.
			// This means it's up to the engines to be "Strong Exception Safe".
			this.engine = undefined;
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
	this.graphWidth = this.getAttribute("$width");
	this.graphHeight = this.getAttribute("$height");
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
		var graphPropertiesNode = {
			type: "properties",
			children: this.parseTreeNode.children
		};
		this.knownObjects = {};
		this.knownProperties = {};
		this.children = [this.makeChildWidget(graphPropertiesNode)];
		this.engine = new Engine(this.wiki);
	}
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

/*
Selectively refreshes the widget if needed. Returns true if the widget or any of its children needed re-rendering
*/
GraphWidget.prototype.refresh = function(changedTiddlers) {
	var changedAttributes = this.computeAttributes(),
		newEngineValue = this.getEngineName();
	if(changedAttributes["$engine"] || changedAttributes["$width"] || changedAttributes["$height"] || (this.engineValue !== newEngineValue)) {
		this.refreshSelf();
		return true;
	}
	var changed = false;
	var objects;
	for (var attribute in changedAttributes) {
		if (attribute === "$width" || attribute === "$height") {
			changed = true;
			this.executeDimensions();
		}
		if (attribute.charAt(0) !== "$") {
			changed = true;
		}
	}
	if (this.refreshChildren(changedTiddlers)) {
		// Children have changed. Look for changed nodes and edges.
		objects = this.findGraphObjects();
		changed = true;
	}
	if (changed || this.refreshColors(changedTiddlers)) {
		var newGraphProperties = this.getViewSettings();
		if (newGraphProperties) {
			objects = objects || {};
			this.properties = newGraphProperties;
			objects.graph = this.typecastProperties(this.properties, "graph");
			changed = true;
		}
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

GraphWidget.prototype.refreshSelf = function() {
	var nextSibling = this.findNextSiblingDomNode();
	this.removeChildDomNodes();
	if (this.engine) {
		this.engine.destroy();
	}
	this.render(this.parentDomNode, nextSibling);
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

GraphWidget.prototype.resize = function() {
	var style = this.graphElement.style;
	if (this.graphWidth) {
		style.width = this.graphWidth;
	}
	if (this.graphHeight) {
		style.height = this.graphHeight;
	}
};

GraphWidget.prototype.destroy = function() {
	if (this.engine) {
		this.engine.destroy();
	}
};

GraphWidget.prototype.isGarbage = function() {
	var body = this.document.body;
	return !body || !body.contains(this.graphElement);
};

GraphWidget.prototype.getEngineName = function() {
	return this.getAttribute("$engine")
		|| this.wiki.getTiddlerText("$:/config/flibbles/graph/engine");
};

GraphWidget.prototype.getViewSettings = function() {
	var newProperties = Object.create(null);
	var self = this;
	if (this.engine) {
		for (var color in graphColors) {
			var widget = this.colorWidgets[color];
			var container = $tw.fakeDocument.createElement("div");
			widget.render(container, null);
			var content = container.textContent;
			if (content) {
				newProperties[color] = content;
			}
		}
		this.children[0].collectGraphProperties(newProperties);
		for (var name in this.attributes) {
			var value = this.attributes[name];
			if (name.charAt(0) !== '$' && value) {
				newProperties[name] = value;
			}
		}
	}
	if (!this.knownProperties
	|| JSON.stringify(newProperties) !== JSON.stringify(this.knownProperties)) {
		this.knownProperties = newProperties;
		return newProperties;
	}
	// Return null if nothing changed
	return null;
};

GraphWidget.prototype.typecastProperties = function(properties, type) {//type, key, value) {
	var output = Object.create(null);
	var catalog = this.engine.properties;
	var category = (catalog && catalog[type]) || {};
	for (var key in properties) {
		var info = category[key];
		if (info && PropertyTypes[info.type]) {
			var value = PropertyTypes[info.type].toProperty(info, properties[key]);
			if (value !== null) {
				output[key] = value;
			}
		} else {
			output[key] = properties[key];
		}
	}
	return output;
};

GraphWidget.prototype.findGraphObjects = function() {
	var self = this;
	var newObjects = this.children[0].updateGraphWidgets(
		function() {return Object.create(null);}
	);
	// Special handling for edge trimming
	withholdObjects(newObjects);
	var prevObjects = this.knownObjects;
	this.knownObjects = newObjects;
	return this.getDifferences(prevObjects, newObjects);
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

GraphWidget.prototype.getDifferences = function(prevObjects, newObjects) {
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
					objects[type][id] = this.typecastProperties(is[id].getGraphObject(), type);
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
				objects[type][id] = this.typecastProperties(is[id].getGraphObject(), type);
				is[id].changed = false;
			}
		}
	}
	return objects;
};

GraphWidget.prototype.handleEvent = function(graphEvent, variables) {
	if (graphEvent.objectType === "graph") {
		var newObjects = this.children[0].invokeGraphActions(graphEvent, variables);
		var actions = this.attributes[graphEvent.type];
		if (actions) {
			this.invokeActionString(actions, this, graphEvent.event, variables);
		}
	} else {
		variables.id = graphEvent.id;
		var category = this.knownObjects[graphEvent.objectType];
		var object = category && category[graphEvent.id];
		// Make sure it's an objects we actually know about
		var focus = object;
		while (object && object !== this) {
			if (object.catchGraphEvent) {
				// Start at the object. Go up, finding any $style to handle this
				object.catchGraphEvent(graphEvent, focus, variables);
			}
			object = object.parentWidget;
		}
	}
};

exports.graph = GraphWidget;
