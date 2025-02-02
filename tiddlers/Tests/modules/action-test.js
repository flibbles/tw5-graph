/*\
module-type: widget

Action widget that makes testing a little easier.

\*/

var Widget = require("$:/core/modules/widgets/widget.js").widget;

var TestWidget = function(parseTreeNode, options) {
	this.initialise(parseTreeNode, options);
};

TestWidget.prototype = new Widget();

TestWidget.prototype.render = function(parent, nextSibling) {
	this.parentDomNode = parent;
	this.computeAttributes();
	this.execute();
	this.renderChildren(parent, nextSibling);
};

TestWidget.prototype.refresh = function(changedTiddlers) {
	var changedAttributes = this.computeAttributes();
	if ($tw.utils.count(changedAttributes) > 0) {
		this.refreshSelf();
		return true;
	}
	return this.refreshChildren(changedAttributes);
};

TestWidget.prototype.invokeAction = function(triggeringWidget, event) {
	$tw.test.actionMethod(this.attributes);
};

exports['action-test'] = TestWidget;
