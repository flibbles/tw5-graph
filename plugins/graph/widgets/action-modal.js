/*\

Action widget that creates a modal to select an existing tiddler, or specify a new one. After dialog is confirmed, it will execute any nested actions it contains.

\*/

"use strict";

var Widget = require("$:/core/modules/widgets/widget.js").widget;
var utils = require("../utils.js");

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
		var self = this;
		// We need to delay the assignment of click handlers for a few
		// milliseconds. See Issue #43. If we don't, a click event might
		// follow right after the "make modal" which closes the modal
		// immediately.
		delayEventListenerAssignment(function() {
			self.modal.display(self.modalTiddler, {
				variables: variables,
				event: event});
		});
	}

};

ModalWidget.prototype.allowActionPropagation = function() {
	return false;
};

function delayEventListenerAssignment(method) {
	var assignments = [];
	// We use this requested window instead of just accessing directly
	// so that the test framework can mock it up.
	var window = utils.window();
	var oldListener = window.EventTarget.prototype.addEventListener;
	window.EventTarget.prototype.addEventListener = function(type) {
		var args = Array.prototype.slice.call(arguments);
		if (type === "click") {
			// This is the click which might accidentally apply to the
			// backdrop if we're on mobile. Delay it.
			assignments.push({self: this, args: args});
		} else {
			// Just call through. We don't care about this handler.
			oldListener.apply(this, args);
		}
	};
	try {
		method();
	} finally {
		window.EventTarget.prototype.addEventListener = oldListener;
	}
	setTimeout(function() {
		for (var i = 0; i < assignments.length; i++) {
			var set = assignments[i];
			set.self.addEventListener.apply(set.self, set.args);
		}
	}, 10);
};

exports["action-modal"] = ModalWidget;
