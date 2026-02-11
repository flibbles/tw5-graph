/*\

Widget for creating graphs.

\*/

"use strict";

var utils = require("../../utils.js");

var PropertyTypes = $tw.modules.getModulesByTypeAsHashmap("graphpropertytype");
// Let's collect all the possible graph object types. We might need to
// reference their base classes later.
var GraphObjectTypes = {};
$tw.modules.forEachModuleOfType("widget-subclass", function(title, module) {
	if (module.baseClass == "graphobject") {
		module.graphObjectType = module.prototype.graphObjectType;
		GraphObjectTypes[module.graphObjectType] = module;
	}
});

var graphColors = {
	nodeColor: "graph-node-color",
	fontColor: "graph-font-color",
	// We pass along the background too, even though it's probably covered
	// by CSS. Some engines might need this for other coloring effects.
	graphColor: "graph-background"
};

exports.baseClass = "graphobject";
exports.name = "graph";

exports.constructor = function(parseTreeNode, options) {
	this.initialise(parseTreeNode, options);
	utils.registerForGarbageCollection(this);
	this.window = utils.window();
};

/*
Inherit from the base widget class
*/
var GraphWidget = exports.prototype = {};

GraphWidget.graphObjectType = "graph";

/*
Render this widget into the DOM
*/
GraphWidget.render = function(parent, nextSibling) {
	this.parentDomNode = parent;
	this.computeAttributes();
	this.execute();
	this.graphElement = this.document.createElement("div");
	var className = "graph-canvas";
	if (!this.graphEngine) {
		className += " graph-error";
	} else {
		className += " graph-engine-" + this.graphEngineName.toLowerCase();
	}
	this.graphElement.className = className;
	this.graphElement.addEventListener("mousemove", this);
	this.domNodes.push(this.graphElement);
	parent.insertBefore(this.graphElement, nextSibling);
	this.renderChildren(this.graphElement, null);

	this.computeParents();
	// Render and recenter the view
	if(this.graphEngine) {
		this.graphEngine.onevent = GraphWidget.handleGraphEvent.bind(this);
		var objects = this.findGraphObjects() || {};
		this.properties = this.refreshProperties() || {};
		objects.graph = this.typecastProperties(this.properties, "graph");
		try {
			this.graphEngine.init(this.graphElement, objects, {wiki: this.wiki});
		} catch(e) {
			// Technically, we should drop this engine without destroying it.
			// It didn't successfully init, so it's not initialized.
			// This means it's up to the engines to be "Strong Exception Safe".
			this.graphEngine = undefined;
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
GraphWidget.execute = function() {
	this.colorWidgets = {};
	this.graphEngineName = this.getEngineName();
	this.setVariable("graphengine", this.graphEngineName);
	this.executeColors();
	this.mouse = {x: "0", y: "0"};
	var Engine = utils.getEngine(this.graphEngineName);
	if (!Engine || this.errorState) {
		var message;
		if (this.errorState) {
			message = this.errorState;
			this.errorState = null;
		} else if (!this.graphEngineName) {
			message = "No graphing libraries installed.";
		} else if (this.getAttribute("$engine")) {
			message = "'" + this.graphEngineName + "' graphing library not found.";
		} else {
			message = "Graph plugin configured to use missing '" + this.graphEngineName + "' engine. Fix this in plugin settings.";
		}
		this.makeChildWidgets([{type: "element", tag: "span", children: [{type: "text", text: message}]}]);
		this.graphEngine = undefined;
	} else {
		this.knownObjects = {};
		this.makeChildWidgets();
		this.graphEngine = new Engine(this.wiki);
	}
};

GraphWidget.executeColors = function() {
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
GraphWidget.refresh = function(changedTiddlers) {
	var changedAttributes = this.computeAttributes(),
		newName = this.getEngineName();
	if(changedAttributes["$engine"] || (this.graphEngineName !== newName)) {
		this.refreshSelf();
		return true;
	}
	var changed = false;
	var objects;
	for (var attribute in changedAttributes) {
		if (attribute.charAt(0) !== "$") {
			changed = true;
		}
	}
	if (this.refreshChildren(changedTiddlers)) {
		// Children have changed. Look for changed nodes and edges.
		objects = this.findGraphObjects();
		changed = true;
	}
	changed = this.computeParents() || changed;
	if (changed || this.refreshColors(changedTiddlers)) {
		var newGraphProperties = this.graphEngine? this.refreshProperties(): Object.create(null);
		if (JSON.stringify(newGraphProperties) !== JSON.stringify(this.properties)) {
			objects = objects || {};
			this.properties = newGraphProperties;
			objects.graph = this.typecastProperties(this.properties, "graph");
			changed = true;
		}
	}
	if (changed) {
		if (!this.graphEngine) {
			// We were in an error state. Maybe we won't be after refreshing.
			this.refreshSelf();
		} else if (objects) {
			try {
				this.graphEngine.update(objects);
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

GraphWidget.refreshSelf = function() {
	var nextSibling = this.findNextSiblingDomNode();
	this.removeChildDomNodes();
	if (this.graphEngine) {
		this.graphEngine.destroy();
	}
	this.render(this.parentDomNode, nextSibling);
};

GraphWidget.refreshColors = function(changedTiddlers) {
	var changed = false;
	for (var color in graphColors) {
		if (!this.colorWidgets[color].refresh(changedTiddlers)) {
			continue;
		}
		changed = true;
	}
	return changed;
};

GraphWidget.garbageCollect = function() {
	if (this.graphEngine) {
		this.graphEngine.destroy();
	}
};

GraphWidget.isGarbage = function() {
	var body = this.document.body;
	return !body || !body.contains(this.graphElement);
};

GraphWidget.getEngineName = function() {
	return this.getAttribute("$engine") || this.getVariable("graphengine");
};

GraphWidget.getColor = function(color) {
	var widget = this.colorWidgets[color];
	var container = $tw.fakeDocument.createElement("div");
	widget.render(container, null);
	return container.textContent;
};

GraphWidget.setCustomProperties = function(properties) {
	for (var name in graphColors) {
		var color = this.getColor(name);
		if (color) {
			properties[name] = color;
		}
	}
};

/**
 * This overrides a graphobject method so we're looking inward instead of
 * upward for properties that apply to this widget.
 */
GraphWidget.traversePropertyWidgets = function(method) {
	var iterator = new utils.WidgetIterator(this);
	var ptr = null;
	var results;
	while (!(results = iterator.next()).done) {
		var widget = results.value;
		if (widget.type === "graph") {
			// We make a quick in place linked list
			results.next = ptr;
			ptr = results;
		}
	}
	// Now we run through that list. This way, we apply the found properties
	// in reverse, since the first found should be executed last as having
	// lowest priority.
	while (ptr !== null) {
		method(ptr.value);
		ptr = ptr.next;
	}
};

GraphWidget.typecastProperties = function(properties, type) {
	var engineDefinitions = this.graphEngine.properties;
	var catalog = (engineDefinitions && engineDefinitions[type]) || {};
	return this.typecastSet(properties, catalog);
};

GraphWidget.typecastSet = function(properties, catalog) {//type, key, value) {
	var output = Object.create(null);
	for (var key in properties) {
		var info = catalog[key];
		if (info && PropertyTypes[info.type]) {
			var value = PropertyTypes[info.type].toProperty(info, properties[key], {widget: this});
			if (value !== null) {
				output[key] = value;
			}
		} else {
			output[key] = properties[key];
		}
	}
	return output;
};

GraphWidget.findGraphObjects = function() {
	var self = this;
	var newObjects = {};
	var iterator = new utils.WidgetIterator(this),
		results;
	while (!(results = iterator.next()).done) {
		var widget = results.value;
		var type = widget.graphObjectType;
		if (type && type !== "graph") {
			newObjects[type] = newObjects[type] || Object.create(null);
			newObjects[type][widget.id] = widget;
		}
	}
	// Special handling for edge trimming
	withholdObjects(newObjects);
	var prevObjects = this.knownObjects;
	this.knownObjects = newObjects;
	return this.getDifferences(prevObjects, newObjects);
};

function withholdObjects(objects) {
	// Blank nodes get filtered
	if (objects.nodes) {
		for (var id in objects.nodes) {
			if (!id) {
				objects.nodes[id] = undefined;
				// This can only happen once
				break;
			}
		}
	}
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

GraphWidget.getDifferences = function(prevObjects, newObjects) {
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
				} else if (is[id].changed || is[id] !== was[id]) {
					// It changed, or is another instance of the same ID.
					// Updated it.
					objects = objects || {};
					objects[type] = objects[type] || Object.create(null);
					objects[type][id] = this.typecastProperties(is[id].properties, type);
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
				objects[type][id] = this.typecastProperties(is[id].properties, type);
				is[id].changed = false;
			}
		}
	}
	return objects;
};

/**
 * This handles messages bubbling up from internal graph widgets
 */
GraphWidget.dispatchEvent = function(event) {
	var messageDef = this.graphEngine.messages && this.graphEngine.messages[event.type];
	if (messageDef) {
		var params = this.typecastSet(event.paramObject, messageDef);
		if (this.graphEngine.handleMessage(event, params) === false) {
			return false;
		}
	}
	if (this.parentWidget) {
		return this.parentWidget.dispatchEvent(event);
	}
};

GraphWidget.handleGraphEvent = function(graphEvent, variables) {
	if (graphEvent.objectType === "graph") {
		var iterator = new utils.WidgetIterator(this);
		var results;
		while (!(results = iterator.next()).done) {
			var widget = results.value;
			if (widget.type === "graph") {
				var actions = widget.properties[graphEvent.type];
				if (actions) {
					widget.invokeActionString(actions, widget, graphEvent.event, variables);
				}
			}
		}
		this.catchGraphEvent(graphEvent, this, variables);
	} else {
		var category = this.knownObjects[graphEvent.objectType];
		var object = category && category[graphEvent.id];
		if (object) {
			variables = variables || {};
			// We let the graph object assign some state, such as the id of the
			// targeted node, or the nodes of the targeted edge.
			var module = GraphObjectTypes[object.graphObjectType];
			if (module) {
				$tw.utils.each(module.actionContext, function(name) {
					variables[name] = object[name];
				});
			}
			// Make sure it's an objects we actually know about
			var target = object;
			while (object && object !== this) {
				if (object.catchGraphEvent) {
					// Start at the object. Go up, finding $style to handle this
					object.catchGraphEvent(graphEvent, target, variables);
				}
				object = object.parentWidget;
			}
		}
	}
};

GraphWidget.handleEvent = function(event) {
	// Must be a mousemove, because that's the only one we signed up for.
	this.mouse.x = event.offsetX;
	this.mouse.y = event.offsetY;
};
