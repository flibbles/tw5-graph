/*\

Specialized form of <$edit-text/> which handles displaying palette colors,
if that's what its underlying value specifies.

\*/

exports.baseClass = "edit-text";
exports.name = "edit-color";

var ColorType = require("../../propertytypes/color.js");

exports.constructor = function(parseTreeNode, options) {
	this.initialise(parseTreeNode, options);
};

var EditWidget = exports.prototype = {};

/*
We expand on getEditInfo to evaluate any potential palette colors and adust
the info accordingly.
*/
EditWidget.getEditInfo = function() {
	var info = Object.getPrototypeOf(Object.getPrototypeOf(this)).getEditInfo.call(this);
	this._rawColor = info.value;
	if (info.value) {
		info.value = ColorType.toProperty(null, info.value, {widget: this}) || info.value;
	}
	return info;
};

/*
We hard-code this widget to be a color input.
*/
EditWidget.execute = function() {
	Object.getPrototypeOf(Object.getPrototypeOf(this)).execute.call(this);
	this.editType = "color";
	this.editTag = "input";
};

/*
We elaborate refresh to also check if the palette has changed.
*/
EditWidget.refresh = function(changedTiddlers) {
	if (Object.getPrototypeOf(Object.getPrototypeOf(this)).refresh.call(this, changedTiddlers)) {
		return true;
	}
	if (ColorType.refresh(null, this._rawColor, changedTiddlers, this)) {
		var editInfo = this.getEditInfo();
		this.updateEditor(editInfo.value, editInfo.type);
	}
};
