/*\
title: $:/plugins/flibbles/graph/widgets/graph.js
type: application/javascript
module-type: widget

Widget for creating graphs.

\*/

"use strict";

var Widget = require("$:/core/modules/widgets/widget.js").widget;

var Engines = $tw.modules.applyMethods("graphengineadapter");

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
	this.graphElement.style.width = "100%";
	this.graphElement.style.height = "300px";
	this.domNodes.push(this.graphElement);

	parent.insertBefore(this.graphElement, nextSibling);
	this.renderChildren(this.graphElement, null);

	// Render and recenter the view
	if(this.engine) {
		var objects = this.findGraphObjects();
		// TODO: Should it be initialise? Is that some british spelling?
		this.engine.initialize(this.graphElement, objects);
		this.engine.onevent = GraphWidget.prototype.handleEvent.bind(this);
		//this.engine.setPhysics(true);
		this.engine.render();
	}
};

/*
Compute the internal state of the widget
*/
GraphWidget.prototype.execute = function() {
	this.engine = this.getAttribute('engine');
	this.knownObjects = {};
	var Engine = Engines[this.engine] || defaultEngine();
	if (!Engine) {
		this.makeChildWidgets([{type: "text", text: "No graphing library found"}]);
	} else {
		this.makeChildWidgets();
		this.engine = new Engine(this.wiki);
	}
};

GraphWidget.prototype.findGraphObjects = function() {
	var newObjects = {};
	var self = this;
	var searchChildren = function(children) {
		for (var i = 0; i < children.length; i++) {
			var widget = children[i];
			if (widget.graphObjectType) {
				var type = widget.graphObjectType;
				var id = widget.id;
				// Instantiate in case this is a prev-unknown graph object
				newObjects[type] = newObjects[type] || Object.create(null);
				self.knownObjects[type] = self.knownObjects[type] || Object.create(null);
				newObjects[type][id] = widget;
				// known objects should know it has a hole.
				self.knownObjects[type][id] = self.knownObjects[type][id] || undefined;
				//if (!self.knownObjects[type][id] || widget.changed) {
					//objects[type][id] = widget.getGraphObject();
				//}
			}
			if (widget.children) {
				searchChildren(widget.children);
			}
		}
	};
	searchChildren(this.children);
	// Special handling for edge trimming
	if (newObjects.edges) {
		for (var id in newObjects.edges) {
			var edge = newObjects.edges[id];
			// This could probably be done above when deleting nulls
			if (!newObjects.nodes
			|| !newObjects.nodes[edge.fromTiddler]
			|| !newObjects.nodes[edge.toTiddler]) {
				// It must be trimmed
				newObjects.edges[id] = undefined;
			}
		}
	}
	var objects = {};
	for (var type in this.knownObjects) {
		var was = this.knownObjects[type];
		var is = newObjects[type];
		for (var id in was) {
			if (is[id]) {
				if (!was[id] || is[id].changed) {
					// It Is, and either Wasn't, or it changed. updated it.
					objects[type] = objects[type] || Object.create(null);
					objects[type][id] = is[id].getGraphObject();
				}
			} else {
				if (was[id]) {
					// It Was, and no longer Is. Flag for deletion
					objects[type] = objects[type] || Object.create(null);
					objects[type][id] = null;
				}
			}
		}
	}
	this.knownObjects = newObjects;
	return objects;
};

/*
Selectively refreshes the widget if needed. Returns true if the widget or any of its children needed re-rendering
*/
GraphWidget.prototype.refresh = function(changedTiddlers) {
	var changedAttributes = this.computeAttributes(),
		hasChangedAttributes = $tw.utils.count(changedAttributes) > 0;
	if(changedAttributes.engine) {
		this.refreshSelf();
		return true;
	} else if (this.refreshChildren(changedTiddlers)) {
		// Children have changed. Look for changed nodes and edges.
		var objects = this.findGraphObjects();
		this.engine.update(objects);
		return true;
	}
	return hasChangedAttributes;
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

function defaultEngine() {
	return Engines['Test'] || Engines['Orb'] || Engines[Object.keys(Engines)[0]];
};

exports.graph = GraphWidget;
