/*\

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

ModalWidget.prototype = new Widget();

ModalWidget.prototype.render = function(parent, nextSibling) {
	this.parentDomNode = parent;
	this.computeAttributes();
	this.execute();
	this.renderChildren(parent, nextSibling);
};

ModalWidget.prototype.execute = function() {
	this.modalTiddler = this.getAttribute("$tiddler");
	this.modal = $tw.modal;
	if (!this.modal || this.modal.wiki !== this.wiki) {
		// Ah, we have a modal working with a subwiki (or a Node.JS system
		// which has no modal). We'll create an overlay of the modal
		// that works with our subwiki instead.
		this.modal = Object.create($tw.modal || null);
		this.modal.wiki = this.wiki;
	}
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
	var variables = Object.create(null);
	for (var key in this.attributes) {
		if (key.charAt(0) !== "$") {
			variables[key] = this.attributes[key];
		}
	}
	if (this.modalTiddler) {
		// Used to be "variables: event.paramObject", not sure why.
		this.modal.display(this.modalTiddler, {
			variables: variables,
			event: event});
	}
};

ModalWidget.prototype.allowActionPropagation = function() {
	return false;
};

exports["action-modal"] = ModalWidget;
