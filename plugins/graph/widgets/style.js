/*\
title: $:/plugins/flibbles/graph/widgets/style.js
type: application/javascript
module-type: widget

Widget for setting styles on graph objects.

\*/

"use strict";

var ContainerWidget = require("./graphcontainer.js").graphcontainer;

var StyleWidget = function(parseTreeNode, options) {
	this.initialise(parseTreeNode, options);
};

StyleWidget.prototype = new ContainerWidget();

StyleWidget.prototype.render = function(parent, nextSibling) {
	this.parentDomNode = parent;
	this.computeAttributes();
	this.execute();
	this.renderChildren(parent, nextSibling);
};

StyleWidget.prototype.execute = function() {
	this.filter = this.getAttribute("$filter");
	this.filterFnc = this.wiki.compileFilter(this.filter || "[all[]]");
	this.styleObject = Object.create(null);
	for (var name in this.attributes) {
		if (name.charAt(0) !== '$') {
			this.styleObject[name] = this.attributes[name];
		}
	}
	this.makeChildWidgets();
};

StyleWidget.prototype.refresh = function(changedTiddlers) {
	var changedAttributes = this.computeAttributes();
	if ($tw.utils.count(changedAttributes) > 0) {
		this.refreshSelf();
		return true;
	}
	return this.refreshChildren(changedTiddlers);
};

exports.style = StyleWidget;
