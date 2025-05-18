/*\

Creates two action widgets for adding and removing from typed fields.

\*/

"use strict";

var Widget = require("$:/core/modules/widgets/widget.js").widget;
var typeOperators = $tw.modules.getModulesByTypeAsHashmap("fieldtype");
var relinkPrefix = "$:/config/flibbles/relink/fields/" ;

var TypedWidget = new Widget();

TypedWidget.render = function(parent, nextSibling) {
	this.computeAttributes();
	this.execute();
};

TypedWidget.execute = function() {
	this.actionTiddler = this.getAttribute("$tiddler") || (!this.hasParseTreeNodeAttribute("$tiddler") && this.getVariable("currentTiddler"));
	this.actionField = this.getAttribute("$field");
	this.actionValue = this.getAttribute("$value");
	this.actionTimestamp = this.getAttribute("$timestamp","yes") === "yes";
	this.actionClean = this.getAttribute("$clean","yes") === "yes";
};

TypedWidget.invokeAction = function(triggeringWidget, event) {
	var tiddler = this.wiki.getTiddler(this.actionTiddler),
		hasChanged = false,
		options = {wiki: this.wiki, widget: this};
	if (this.actionTiddler && this.actionField) {
		options.suppressTimestamp = !this.actionTimestamp;
		var typeName = this.wiki.getTiddlerText(relinkPrefix + this.actionField, "list");
		var type = typeOperators[typeName];
		if (type) {
			var newValue = type[this.actionMethod](tiddler, this.actionField, this.actionValue, options);
			if (newValue !== undefined) {
				if (newValue === "" && this.actionClean) {
					newValue = undefined;
				}
				options.wiki.setText(this.actionTiddler, this.actionField, null, newValue, options);
			}
		}
	}
};

$tw.utils.each(["add", "remove"], function(method) {
	var MethodWidget = function(parseTreeNode, options) {
		this.initialise(parseTreeNode, options);
	};

	MethodWidget.prototype = Object.create(TypedWidget);
	MethodWidget.prototype.actionMethod = method;
	exports["action-" + method + "typed"] = MethodWidget;
});
