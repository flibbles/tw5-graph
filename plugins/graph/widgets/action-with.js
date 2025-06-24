/*\

Action widget that executes actions within it while exposing variables representing the mouse's current location.

\*/

"use strict";

var Widget = require("$:/core/modules/widgets/widget.js").widget;

var WithWidget = function(parseTreeNode, options) {
	this.initialise(parseTreeNode, options);
};

WithWidget.prototype = new Widget();

WithWidget.prototype.render = function(parent, nextSibling) {
	this.parentDomNode = parent;
	this.computeAttributes();
	this.execute();
	this.renderChildren(parent, nextSibling);
};

WithWidget.prototype.execute = function() {
	this.withOffset = this.getAttribute("$offset");
	this.withCanvas = this.getAttribute("$canvas");
	this.makeChildWidgets();
};

WithWidget.prototype.refresh = function(changedTiddlers) {
	var changedAttributes = this.computeAttributes();
	for (var attribute in changedAttributes) {
		this.refreshSelf();
		return true;
	}
	return this.refreshChildren(changedTiddlers);
};

WithWidget.prototype.invokeAction = function(triggeringWidget, event) {
	var graph = getGraphWidget(this);
	if (graph) {
		if (this.withOffset) {
			var mouse = graph.mouse,
				x = mouse.x.toString(),
				y = mouse.y.toString();
			this.setVariable(this.withOffset + "-posx", x);
			this.setVariable(this.withOffset + "-posy", y);
		}
		if (this.withCanvas) {
			var element = graph.graphElement;
			this.setVariable(this.withCanvas + "-width", element.offsetWidth);
			this.setVariable(this.withCanvas + "-height", element.offsetHeight);
		}
	}
	this.refreshChildren();
	return true;
};

function getGraphWidget(self) {
	var widget = self.parentWidget;
	while (widget) {
		if (widget.graphObjectType === "graph") {
			return widget;
		}
		widget = widget.parentWidget;
	}
	return null;
};

exports["action-with"] = WithWidget;
