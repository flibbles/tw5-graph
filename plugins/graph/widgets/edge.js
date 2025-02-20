/*\
title: $:/plugins/flibbles/graph/widgets/edge.js
type: application/javascript
module-type: widget

Widget for creating edges within graphs.

\*/

"use strict";

var Widget = require("$:/core/modules/widgets/widget.js").widget;
var nextId = 1;

var EdgeWidget = function(parseTreeNode, options) {
	this.initialise(parseTreeNode, options);
	this.id = nextId.toString();
	nextId++;
};

EdgeWidget.prototype = new Widget();

EdgeWidget.prototype.graphObjectType = "edges";

EdgeWidget.prototype.render = function(parent, nextSibling) {
	this.parentDomNode = parent;
	this.computeAttributes();
	this.execute();
	this.renderChildren(parent, nextSibling);
};

EdgeWidget.prototype.execute = function() {
	// TODO: Maybe this should be $from
	this.fromTiddler = this.getAttribute("from", this.getVariable("currentTiddler"));
	this.toTiddler = this.getAttribute("to");
	this.settings = Object.create(null);
	for (var key in this.attributes) {
		if (key.charAt(0) !== "$" && key !== "from") {
			var value = this.attributes[key];
			if (value) {
				this.settings[key] = this.attributes[key];
			}
		}
	}
	// We're new, so we're changed. Announce ourselves when asked.
	this.changed = true;
	this.makeChildWidgets();
};

EdgeWidget.prototype.refresh = function(changedTiddlers) {
	var changedAttributes = this.computeAttributes();
	// TODO: This could be tightened if this.settings and this.object were combined, and we only detect actual differences.
	for (var attribute in changedAttributes) {
		this.refreshSelf();
		return true;
	}
	return this.refreshChildren(changedTiddlers);
};

EdgeWidget.prototype.allowActionPropagation = function() {
	return false;
};

EdgeWidget.prototype.getGraphObject = function() {
	this.changed = false;
	return this.object;
};

/* When testing applicability in a $style filter, use the from and to tiddlers
 * as input sources.
 */
EdgeWidget.prototype.getGraphFilterSource = function() {
	return [this.fromTiddler, this.toTiddler];
};

EdgeWidget.prototype.setStyle = function(data) {
	this.object = $tw.utils.extend(data, this.settings);
	this.object.from = this.fromTiddler;
};

exports.edge = EdgeWidget;
