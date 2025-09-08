/*\

Widget for relaying emitted messages to other parts of the widget.
This allows buttons for a graph to exist outside of that graph.

\*/

"use strict";

var Widget = require("$:/core/modules/widgets/widget.js").widget;

var relayed = Object.create(null);

var RelayWidget = function(parseTreeNode, options) {
	this.initialise(parseTreeNode, options);
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
	}
	this.makeChildWidgets();
};

RelayWidget.prototype.refresh = function(changedTiddlers) {
	var changedAttributes = this.computeAttributes();
	if ($tw.utils.count(changedAttributes) > 0) {
		this.refreshSelf();
		return true;
	}
	return this.refreshChildren(changedTiddlers);
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
			targets[i].dispatchEvent(event);
		}
	} else {
		return Widget.prototype.dispatchEvent.call(this, event);
	}
};

exports.messagerelay = RelayWidget;
