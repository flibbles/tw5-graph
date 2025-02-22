/*\
title: $:/plugins/flibbles/graph/widgets/action-modal.js
type: application/javascript
module-type: widget

Action widget that creates a modal to select an existing tiddler, or specify a new one. After dialog is confirmed, it will execute any nested actions it contains.

\*/

"use strict";

var Widget = require("$:/core/modules/widgets/widget.js").widget;

/**
 * This points to whatever action invoked the current modal. It assumes that
 * only one modal is possible at a time. Probably a safe assumption.
 */
var primedWidget;

var ModalWidget = function(parseTreeNode, options) {
	this.initialise(parseTreeNode, options);
};

// TODO: Make sure all the \widgets aren't introducing whitespace
ModalWidget.prototype = new Widget();

ModalWidget.prototype.render = function(parent, nextSibling) {
	this.parentDomNode = parent;
	this.computeAttributes();
	this.execute();
	this.renderChildren(parent, nextSibling);
};

ModalWidget.prototype.execute = function() {
	this.modal = this.getAttribute("$tiddler");
	this.makeChildWidgets();
};

ModalWidget.prototype.refresh = function(changedTiddlers) {
	var changedAttributes = this.computeAttributes();
	if ($tw.utils.count(changedAttributes) > 0) {
		this.refreshSelf();
		return true;
	}
	return this.refreshChildren(changedTiddlers);
};

ModalWidget.prototype.invokeAction = function(triggeringWidget, event) {
	if (!$tw.rootWidget.eventListeners['tm-modal-finish']) {
		$tw.rootWidget.addEventListener("tm-modal-finish", function(finishEvent) {
			if (primedWidget) {
				var value = finishEvent.param;
				primedWidget.setVariable("selection", value);
				primedWidget.refreshChildren();
				primedWidget.invokeActions(primedWidget, event);
				primedWidget = undefined;
			}
		});
	}
	primedWidget = this;
	if (this.modal) {
		$tw.modal.display(this.modal, {variables: event.paramObject, event: event});
	}
};

ModalWidget.prototype.allowActionPropagation = function() {
	return false;
};

exports["action-modal"] = ModalWidget;
