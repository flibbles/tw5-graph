/*\

Widget for relaying emitted messages to other parts of the widget.
This allows buttons for a graph to exist outside of that graph.

\*/

"use strict";

var Widget = require("$:/core/modules/widgets/widget.js").widget;
var utils = require("../utils.js");

// Relayed is used to avoid infinite loops. Once an event is relayed,
// it puts itself in this object under the relay name, so it can't be
// relayed again through that name
var relayed = Object.create(null);

var RelayWidget = function(parseTreeNode, options) {
	this.initialise(parseTreeNode, options);
	utils.registerForDestruction(this);
};

RelayWidget.prototype = new Widget();

RelayWidget.prototype.render = function(parent, nextSibling) {
	this.parentDomNode = parent;
	this.computeAttributes();
	this.execute();
	this.renderChildren(parent, nextSibling);
};

RelayWidget.prototype.execute = function() {
	this.relayName = this.getAttribute("name");
	this.relayTo = this.getAttribute("to");
	if (this.relayName) {
		var register = this.wiki.relayRegister = this.wiki.relayRegister || Object.create(null);
		register[this.relayName] = register[this.relayName] || [];
		register[this.relayName].push(this);
		this.relayRootWidget = rootWidget(this);
	}
	this.makeChildWidgets();
};

RelayWidget.prototype.refresh = function(changedTiddlers) {
	var changedAttributes = this.computeAttributes();
	var changed = false;
	if (changedAttributes.name) {
		this.destroy();
		this.refreshSelf();
		return true;
	}
	if (changedAttributes.to) {
		this.relayTo = this.getAttribute("to");
		changed = true;
	}
	return this.refreshChildren(changedTiddlers) || changed;
};

RelayWidget.prototype.dispatchEvent = function(event) {
	var register = this.wiki.relayRegister;
	if (this.relayTo
	&& register
	&& register[this.relayTo]
	&& relayed[this.relayTo] !== event) {
		relayed[this.relayTo] = event;
		var targets = register[this.relayTo];
		for (var i = 0; i < targets.length; i++) {
			var target = targets[i];
			if (!target.isGarbage()) {
				targets[i].dispatchEvent(event);
			}
		}
	} else {
		return Widget.prototype.dispatchEvent.call(this, event);
	}
};

RelayWidget.prototype.isGarbage = function() {
	var oldRoot = this.relayRootWidget;
	return oldRoot !== rootWidget(this);
};

RelayWidget.prototype.destroy = function() {
	if (this.relayName) {
		var register = this.wiki.relayRegister[this.relayName];
		for (var i = 0; i < register.length; i++) {
			if (register[i] === this) {
				// Remove this from the register
				register.splice(i, 1);
			}
		}
		this.relayName = undefined;
	}
};

function rootWidget(relay) {
	var parent = relay.parentWidget;
	while (parent) {
		var i = 0;
		for (; i < parent.children.length; i++) {
			if (parent.children[i] === relay) {
				// Confirmed that the parent still owns this child
				break;
			}
		}
		if (i == parent.children.length) {
			// Ownership was not confirmed
			return null;
		}
		relay = parent;
		parent = relay.parentWidget;
	}
	return relay;
};

exports.messagerelay = RelayWidget;
