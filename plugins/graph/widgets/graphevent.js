/*\
title: $:/plugins/flibbles/graph/widgets/graphevent.js
type: application/javascript
module-type: widget

Widget for catching graph events such as hover and mouse clicks.

\*/

"use strict";

var Widget = require("$:/core/modules/widgets/widget.js").widget;

var EventWidget = function(parseTreeNode, options) {
	this.initialise(parseTreeNode, options);
};

/*
Inherit from the base widget class
*/
EventWidget.prototype = new Widget();

EventWidget.prototype.render = function(parent, nextSibling) {
	this.parentDomNode = parent;
	this.computeAttributes();
	this.execute();
	this.renderChildren(parent, nextSibling);
};

EventWidget.prototype.refresh = function(changedTiddlers) {
	this.computeAttributes();
	return this.refreshChildren(changedTiddlers);
};

exports.graphevent = EventWidget;
