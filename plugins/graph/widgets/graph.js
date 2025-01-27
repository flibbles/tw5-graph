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
		this.nodes = objects.nodes;
		this.edges = objects.edges;
		this.engine.initialize(this.graphElement, this.nodes, this.edges);
		this.engine.setPhysics(true);
		this.engine.render();
	}
};

/*
Compute the internal state of the widget
*/
GraphWidget.prototype.execute = function() {
	this.engine = this.getAttribute('engine');
	var Engine = Engines[this.engine] || defaultEngine();
	if (!Engine) {
		this.makeChildWidgets([{type: "text", text: "No graphing library found"}]);
	} else {
		this.makeChildWidgets();
		this.engine = new Engine(this.wiki);
	}
};

GraphWidget.prototype.findGraphObjects = function() {
	var nodes = [];
	var edges = [];
	var searchChildren = function(children) {
		for (var i = 0; i < children.length; i++) {
			var widget = children[i];
			if (widget.getGraphData) {
				var object = widget.getGraphData()
				if (object) {
					if (object.type !== "edge") {
						nodes.push(object);
					} else {
						// Give it a temporary id for now. We'll do something more sophisticated later.
						edges.push(object);
						object.id = edges.length;
					}
				}
			}
			if (widget.children) {
				searchChildren(widget.children);
			}
		}
	};
	searchChildren(this.children);
	return {nodes, edges};
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
		this.engine.modify(objects.nodes, objects.edges);
		return true;
	}
	return hasChangedAttributes;
};

function defaultEngine() {
	return Engines['Test'] || Engines['Orb'] || Engines[Object.keys(Engines)[0]];
};

exports.graph = GraphWidget;
