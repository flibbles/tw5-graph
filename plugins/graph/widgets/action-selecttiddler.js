/*\
title: $:/plugins/flibbles/graph/widgets/action-selecttiddler.js
type: application/javascript
module-type: widget

Action widget that creates a modal to select an existing tiddler, or specify a new one. After dialog is confirmed, it will execute any nested actions it contains.

\*/

"use strict";

var Widget = require("$:/core/modules/widgets/widget.js").widget;
var primedWidget;

var SelectTiddlerWidget = function(parseTreeNode, options) {
	this.initialise(parseTreeNode, options);
};

SelectTiddlerWidget.prototype = new Widget();

SelectTiddlerWidget.prototype.invokeAction = function(triggeringWidget, event) {
	if (!$tw.rootWidget.eventListeners['tm-select-finish']) {
		$tw.rootWidget.addEventListener("tm-select-finish", function(finishEvent) {
			if (primedWidget) {
				var value = finishEvent.param;
				primedWidget.setVariable("selectTiddler", value);
				primedWidget.invokeActions(primedWidget, event);
				primedWidget = undefined;
			}
		});
	}
	primedWidget = this;
	$tw.modal.display("$:/plugins/flibbles/graph/Modals/SelectTiddler", {variables: event.paramObject, event: event});
	this.dispatchEvent({
		type: "tm-focus-selector",
		param: "input.graph-select",
		event: event
	});
	// Modeled after DeleteFieldWidget
};

exports["action-selecttiddler"] = SelectTiddlerWidget;
