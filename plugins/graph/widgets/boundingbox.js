/*\

Widget for creating a DOM element which has strictly controlled dimensions,
intended for a contained graph.

\*/

"use strict";

var Widget = require("$:/core/modules/widgets/widget.js").widget;
var utils = require("../utils.js");

var BoxWidget = function(parseTreeNode, options) {
	this.initialise(parseTreeNode, options);
	utils.registerForDestruction(this);
	this.resizeInstance = this.resize.bind(this);
	this.window = utils.window();
	this.window.addEventListener("resize", this.resizeInstance);
};

/*
Inherit from the base widget class
*/
BoxWidget.prototype = new Widget();

/*
Render this widget into the DOM
*/
BoxWidget.prototype.render = function(parent, nextSibling) {
	this.parentDomNode = parent;
	this.computeAttributes();
	this.execute();
	this.domNode = this.document.createElement("div");
	var nodeClass = "boundingbox";
	if (this.boxClass) {
		nodeClass += " " + this.boxClass;
	}
	this.domNode.className = nodeClass;
	parent.insertBefore(this.domNode, nextSibling);
	// Make sure this comes AFTER inserting domNode into the tree,
	// otherwise getBoundingClientRect() will be all zeros.
	this.resize();
	this.renderChildren(this.domNode, null);
	this.domNodes.push(this.domNode);
};

/*
Compute the internal state of the widget
*/
BoxWidget.prototype.execute = function() {
	this.boxClass = this.getAttribute("class", "");
	this.executeDimensions();
	this.makeChildWidgets();
};

BoxWidget.prototype.executeDimensions = function() {
	var self = this;
	this.widthFilter = this.wiki.compileFilter(this.getAttribute("width", ""));
	this.heightFilter = this.wiki.compileFilter(this.getAttribute("height", ""));
	this.dimensionWidget = this.wiki.makeWidget({tree: [{type: "widget", children: []}]}, {parentWidget: this});
	this.dimensionWidget.execute();
	// We set up the widget so it only gets values for these variables
	// if needed. This keeps down unncessary calls to window and document,
	// and makes the $graph widget usable on Node, if that ever comes up.
	var variables = {
		// It may be better to use document.body.clientWidth,
		// which doesn't consider the scrollbar.
		windowWidth: function() { return self.window.innerWidth.toString(); },
		windowHeight: function() { return self.window.innerHeight.toString(); },
		boundingLeft: function() { return self.domNode.getBoundingClientRect().left.toString(); },
		boundingTop: function() { return self.domNode.getBoundingClientRect().top.toString(); },
	};
	for (var name in variables) {
		this.dimensionWidget.setVariable(name);
		Object.defineProperty(this.dimensionWidget.variables[name], "value", { get: variables[name] });
	}
};

/*
Selectively refreshes the widget if needed. Returns true if the widget or any of its children needed re-rendering
*/
BoxWidget.prototype.refresh = function(changedTiddlers) {
	var changedAttributes = this.computeAttributes();
	if (changedAttributes["class"]) {
		this.refreshSelf();
		return true;
	}
	var changed = false;
	if ($tw.utils.count(changedAttributes) > 0) {
		this.executeDimensions();
		changed = true;
	}
	// We always try to resize.
	// The $dimension filters might spit out something different.
	this.resize();
	return this.refreshChildren(changedTiddlers) || changed;
};

BoxWidget.prototype.resize = function(event) {
	var widget = this.dimensionWidget.children[0];
	var newWidth = this.widthFilter(null, widget)[0] || "";
	var newHeight = this.heightFilter(null, widget)[0] || "";
	var style = this.domNode.style;
	if (newWidth !== style.width) {
		style.width = newWidth;
	}
	if (newHeight !== style.height) {
		style.height = newHeight;
	}
};

BoxWidget.prototype.destroy = function() {
	this.window.removeEventListener("resize", this.resizeInstance);
};

BoxWidget.prototype.isGarbage = function() {
	var body = this.document.body;
	return !body || !body.contains(this.domNode);
};

exports.boundingbox = BoxWidget;
