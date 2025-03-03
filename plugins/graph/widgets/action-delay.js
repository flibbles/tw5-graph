/*\
title: $:/plugins/flibbles/graph/widgets/action-delay.js
type: application/javascript
module-type: widget

Action widget that introduces a delay before executing any nested actions it contains.

\*/

"use strict";

var Widget = require("$:/core/modules/widgets/widget.js").widget;

var DelayWidget = function(parseTreeNode, options) {
	this.initialise(parseTreeNode, options);
};

DelayWidget.prototype = new Widget();

DelayWidget.prototype.render = function(parent, nextSibling) {
	this.parentDomNode = parent;
	this.computeAttributes();
	this.execute();
	this.renderChildren(parent, nextSibling);
};

DelayWidget.prototype.execute = function() {
	this.ms = this.getAttribute("$ms", 0);
	this.state = this.getAttribute("$state");
	this.makeChildWidgets();
};

DelayWidget.prototype.refresh = function(changedTiddlers) {
	var changedAttributes = this.computeAttributes();
	if ($tw.utils.count(changedAttributes) > 0) {
		this.refreshSelf();
		return true;
	}
	return this.refreshChildren(changedTiddlers);
};

var counter = 0;

DelayWidget.prototype.invokeAction = function(triggeringWidget, event) {
	// The id is used to make sure the later timed invocation corresponds
	// to this method call here.
	var id = (counter++).toString();
	if (this.state) {
		this.wiki.addTiddler({title: this.state, text: id});
	}
	return setTimeout(execute, this.ms, this, triggeringWidget, event, id);
};

DelayWidget.prototype.allowActionPropagation = function() {
	return false;
};

function execute(delayWidget, triggeringWidget, event, id) {
	var state = delayWidget.state;
	if (state) {
		var text = delayWidget.wiki.getTiddlerText(state);
		if (text !== id) {
			// The state tiddler was touched by another action.
			// So we should not act. We're stale.
			return;
		}
	}
	delayWidget.refreshChildren();
	delayWidget.invokeActions(triggeringWidget, event);
	if (state) {
		delayWidget.wiki.deleteTiddler(state);
	}
};

exports["action-delay"] = DelayWidget;
