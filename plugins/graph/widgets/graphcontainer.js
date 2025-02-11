/*\
title: $:/plugins/flibbles/graph/widgets/graphcontainer.js
type: application/javascript
module-type: library

Widget for creating graphs.

\*/

"use strict";

var Widget = require("$:/core/modules/widgets/widget.js").widget;

var ContainerWidget = function() {};

ContainerWidget.prototype = new Widget();

exports.graphcontainer = ContainerWidget;

ContainerWidget.prototype.getGraphWidgets = function(objects, parentCallback) {
	var self = this;
	var callback = !this.styleObject? parentCallback: function(id) {
		var object = parentCallback(id);
		if (self.filterFnc([id]).length > 0) {
			for (var style in self.styleObject) {
				object[style] = self.styleObject[style];
			}
		}
		return object;
	};
	var searchChildren = function(children) {
		for (var i = 0; i < children.length; i++) {
			var widget = children[i];
			if (widget.graphObjectType) {
				var type = widget.graphObjectType;
				widget.styleMethod = callback;
				objects[type] = objects[type] || Object.create(null);
				objects[type][widget.id] = widget;
			}
			if (widget.getGraphWidgets) {
				widget.getGraphWidgets(objects, callback);
			} else if (widget.children) {
				searchChildren(widget.children);
			}
		}
	};
	searchChildren(this.children, null);
};

