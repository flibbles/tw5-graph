/*\

Widget for transcribing the text of one data tiddler
into the field of another. and vice-versa.

\*/

"use strict";

var Widget = require("$:/core/modules/widgets/widget.js").widget;

var Scribers = $tw.modules.getModulesByTypeAsHashmap("fieldtranscribertype");

var ScriberWidget = function(parseTreeNode, options) {
	this.initialise(parseTreeNode, options);
};

ScriberWidget.prototype = new Widget();

ScriberWidget.prototype.render = function(parent, nextSibling) {
	this.parentDomNode = parent;
	this.computeAttributes();
	this.execute();
	this.renderChildren(parent, nextSibling);
};

ScriberWidget.prototype.execute = function() {
	this.scribeField = this.getAttribute("field");
	this.scribeTiddler = this.getAttribute("tiddler") || (!this.hasParseTreeNodeAttribute("tiddler") && this.getVariable("currentTiddler"));
	this.scribeType = this.getAttribute("type");
	this.scribeState = this.getAttribute("state");
	if (!this.scribeState) {
		this.scribeState = "$:/temp/flibbles/graph/fieldtranscriber/" + encodeURIComponent(this.scribeField) + "/" + this.scribeTiddler;
	}
	if (!Scribers[this.scribeType]) {
		this.scribeType = "text/plain";
	}
	this.setVariable("state", this.scribeState);
	this.transcriber = Scribers[this.scribeType];
	this.prepState();
	this.makeChildWidgets();
};

ScriberWidget.prototype.refresh = function(changedTiddlers) {
	var changedAttributes = this.computeAttributes();
	if ($tw.utils.count(changedAttributes) > 0) {
		this.refreshSelf();
		return true;
	}
	if (changedTiddlers[this.scribeState] && this.scribeField) {
		// Our tracked state has changed. Time to transcribe.
		var state = this.wiki.getTiddler(this.scribeState);
		if (state) {
			var stateText = state.getFieldString("text");
			if (this.stateText !== stateText) {
				var fieldText = this.transcriber.toField(stateText);
				if (fieldText !== this.fieldText) {
					this.wiki.setText(this.scribeTiddler, this.scribeField, null, fieldText);
					this.fieldText = fieldText;
					this.stateText = stateText;
				}
			}
		} else {
			this.wiki.setText(this.scribeTiddler, this.scribeField, null, undefined);
			this.fieldText = undefined;
			this.stateText = undefined;
		}
	}
	if (changedTiddlers[this.scribeTiddler]) {
		this.prepState();
	}
	return this.refreshChildren(changedTiddlers);
};

ScriberWidget.prototype.prepState = function() {
	if (this.scribeState && this.scribeField) {
		var tiddler = this.wiki.getTiddler(this.scribeTiddler);
		if (tiddler) {
			var fieldText = tiddler.fields[this.scribeField];
			if (this.fieldText !== fieldText) {
				this.fieldText = fieldText;
				if (fieldText === undefined) {
					this.wiki.deleteTiddler(this.scribeState);
					this.stateText = undefined;
				} else {
					this.stateText = this.transcriber.fromField(fieldText);
					this.wiki.addTiddler({
						title: this.scribeState,
						text: this.stateText,
						type: this.scribeType
					});
				}
			}
		}
	}
};

exports.fieldtranscriber = ScriberWidget;
