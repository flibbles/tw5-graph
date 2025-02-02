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
	this.knownNodes = new Map();
	this.knownEdges = new Map();
	var Engine = Engines[this.engine] || defaultEngine();
	if (!Engine) {
		this.makeChildWidgets([{type: "text", text: "No graphing library found"}]);
	} else {
		this.makeChildWidgets();
		this.engine = new Engine(this.wiki);
	}
};

GraphWidget.prototype.findGraphObjects = function() {
	var nodeStillExists = Object.create(null);
	var edgeStillExists = Object.create(null);
	var objects = {nodes: Object.create(null), edges: Object.create(null)};
	var self = this;
	var searchChildren = function(children) {
		for (var i = 0; i < children.length; i++) {
			var widget = children[i];
			if (widget.getNodeData) {
				var id = widget.id;
				nodeStillExists[id] = true;
				self.knownNodes.set(id, widget);
				if (widget.changed) {
					objects.nodes[id] = widget.getNodeData();
				}
			}
			if (widget.getEdgeData) {
				var id = widget.id;
				edgeStillExists[id] = true;
				self.knownEdges.set(id, widget);
				if (widget.changed) {
					objects.edges[id] = widget.getEdgeData();
				}
			}
			if (widget.children) {
				searchChildren(widget.children);
			}
		}
	};
	searchChildren(this.children);
	for (var id of this.knownNodes.keys()) {
		if (!nodeStillExists[id]) {
			this.knownNodes.delete(id);
			objects.nodes[id] = null;
		}
	}
	for (var id of this.knownEdges.keys()) {
		if (!edgeStillExists[id]) {
			this.knownEdges.delete(id);
			objects.edges[id] = null;
		}
	}
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
	if (params.type === "doubleclick") {
		this.setVariable("point", params.point.x + " " + params.point.y);
		if (params.target === "node") {
			var node = this.knownNodes.get(params.id);
			node.invokeActions(this, params);
		} else if (params.target === "graph") {
			this.invokeActions(this, params);
		}
	} else if (params.type === "drag") {
		var node = this.knownNodes.get(params.id);
		node.invokeDragAction(this, params);
	} else if (params.type === "hover") {
		if (params.target === "node") {
			var node = this.knownNodes.get(params.id);
			this.dispatchEvent(node, params);
		}
	}
};

GraphWidget.prototype.dispatchEvent = function(object, params) {
	do {
		if (object.catchGraphEvent && object.catchGraphEvent(params)) {
			return true;
		}
		object = object.parentWidget;
	} while (object !== this);
	return false;
};

function defaultEngine() {
	return Engines['Test'] || Engines['Orb'] || Engines[Object.keys(Engines)[0]];
};

exports.graph = GraphWidget;
