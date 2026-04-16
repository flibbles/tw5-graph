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
		this.knownObjects = findGraphObjects(this);
		var objects = getDifferences(this.graphEngine, {}, this.knownObjects) || {};
		this.properties = this.computeProperties();
		objects.graph = typecastProperties(this, this.properties, getCatalog(this.graphEngine, "graph"));
		this.typedProperties = objects.graph;
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
	this.graphEngineName = this.getEngineName();
	this.setVariable("graphengine", this.graphEngineName);
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
	var selfChanged = false, childrenChanged = false;
	var objects;
	for (var attribute in changedAttributes) {
		if (attribute.charAt(0) !== "$") {
			selfChanged = true;
			break;
		}
	}
	if (this.refreshChildren(changedTiddlers)) {
		childrenChanged = true;
	}
	if (!this.graphEngine && (selfChanged || childrenChanged)) {
		// At this point, we know widgets have literally changed.
		// If we're in an error state, we can refresh self now, because
		// all properties would have to be regenerated anyway.
		this.refreshSelf();
		return true;
	}
	// From here on, we now try to narrow down which properties changed,
	// because we can update instead of full refresh. Updates only bother
	// with changed properties.
	if (childrenChanged) {
		// Children have changed. Look for changed nodes and edges.
		var prevObjects = this.knownObjects;
		this.knownObjects = findGraphObjects(this);
		objects = getDifferences(this.graphEngine, prevObjects, this.knownObjects);
	}
	selfChanged = this.computeParents() || selfChanged;
	if (selfChanged
	|| utils.refreshProperties(this.properties, this, this.graphObjectType, changedTiddlers)) {
		this.properties = this.computeProperties();
		var newTypecastProperties = typecastProperties(this, this.properties, getCatalog(this.graphEngine, "graph"));
		if (JSON.stringify(newTypecastProperties) !== JSON.stringify(this.typedProperties)) {
			this.typedProperties = newTypecastProperties;
			objects = objects || {};
			objects.graph = newTypecastProperties;
		}
	}
	if (objects) {
		try {
			this.graphEngine.update(objects);
		} catch (e) {
			// Something went wrong. Rebuild this widget as an error displayer
			console.error(e);
			this.errorState = e.message || e.toString();
			this.refreshSelf();
		}
	}
	return selfChanged || childrenChanged;
};

GraphWidget.refreshSelf = function() {
	var nextSibling = this.findNextSiblingDomNode();
	this.removeChildDomNodes();
	if (this.graphEngine) {
		this.graphEngine.destroy();
	}
	this.render(this.parentDomNode, nextSibling);
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

GraphWidget.setCustomProperties = function(properties) {
	var catalog = getCatalog(this.graphEngine, "graph");
	for (var name in catalog) {
		var property = catalog[name];
		// It's hidden, and it has a default, so this is an auto-fill property
		if (property.hidden && property.default) {
			properties[name] = property.default;
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

/**
 * This handles messages bubbling up from internal graph widgets
 */
GraphWidget.dispatchEvent = function(event) {
	var messageDef = this.graphEngine.messages && this.graphEngine.messages[event.type];
	if (messageDef) {
		// TODO: I think I should change this so the widget is the
		//       messageWidget, not the graph widget.
		var params = typecastProperties(this, event.paramObject, messageDef);
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
			// We let the graph object assign some state,such as the id of the
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
	// All we do is remember the mouse position if we need it later for
	// graph events.
	this.mouse.x = event.offsetX;
	this.mouse.y = event.offsetY;
};
function getCatalog(graphEngine, type) {
	var definitions = graphEngine.properties;
	return (definitions && definitions[type]) || Object.create(null);
};

function typecastProperties(widget, properties, catalog) {
	var output = Object.create(null);
	for (var key in properties) {
		var info = catalog[key];
		if (info && PropertyTypes[info.type]) {
			var value = PropertyTypes[info.type].toProperty(info, properties[key], {wiki: widget.wiki, widget: widget});
			if (value !== null) {
				output[key] = value;
			}
		} else {
			output[key] = properties[key];
		}
	}
	return output;
};

function findGraphObjects(graphWidget) {
	var newObjects = {};
	var iterator = new utils.WidgetIterator(graphWidget),
		results;
	while (!(results = iterator.next()).done) {
		var widget = results.value;
		var type = widget.graphObjectType;
		if (type && type !== "graph") {
			newObjects[type] = newObjects[type] || Object.create(null);
			newObjects[type][widget.id] = widget;
		}
	}
	// Prune any objects which shouldn't be passed along
	curateObjects(newObjects);
	return newObjects;
};

/**
 * Checking for objects that should be pruned must take place after all
 * objects have been collected. Some object types, like edge, need to know
 * what other objects are present to know if they're valid or not.
 */
function curateObjects(objects) {
	for (var groupName in objects) {
		var type = GraphObjectTypes[groupName];
		if (type || type.graphObjectType !== "graph") {
			var index = 0;
			var group = objects[groupName];
			for (var id in group) {
				if (group[id].isDisqualified(objects)) {
					group[id] = undefined;
				} else {
					group[id].index = index;
					++index;
				}
			}
		}
	}
};

function getDifferences(graphEngine, prevObjects, newObjects) {
	var objects = null
	for (var type in prevObjects) {
		var was = prevObjects[type];
		var is = newObjects[type];
		var catalog = getCatalog(graphEngine, type);
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
					objects[type][id] = typecastProperties(is[id], is[id].properties, catalog);
					is[id].changed = false;
				}
			}
		}
	}
	for (var type in newObjects) {
		var was = prevObjects? prevObjects[type]: undefined;
		var is = newObjects[type];
		var catalog = getCatalog(graphEngine, type);
		for (var id in is) {
			if (is[id] && (!was || !was[id])) {
				// It has been added. Add it.
				objects = objects || {};
				objects[type] = objects[type] || Object.create(null);
				objects[type][id] = typecastProperties(is[id], is[id].properties, catalog);
				is[id].changed = false;
			}
		}
	}
	return objects;
};
