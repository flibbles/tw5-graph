/*\
title: $:/plugins/flibbles/graph/utils/widgetiterator.js
type: application/javascript
module-type: graphutils

Can be used to iterate through a tree of widgets, given a root.

It goes depth-first, starting the the first leaf widget, and finishes with
the root widget.

\*/

exports.WidgetIterator = function(root) {
	this.stack = [];
	this.ptr = root;
	while (this.ptr.children && this.ptr.children.length > 0) {
		this.stack.push(0);
		this.ptr = this.ptr.children[0];
	}
};

exports.WidgetIterator.prototype.next = function() {
	var rtn, ptr = this.ptr;
	if (!ptr) {
		rtn = {done: true};
	} else {
		rtn = {value: ptr, done: false};
		ptr = ptr.parentWidget;
		var index = this.stack.pop();
		if (index !== undefined) {
			index++;
			if (ptr && ptr.children.length > index) {
				ptr = ptr.children[index];
				this.stack.push(index);
				// Now dive to the lowest child
				while (ptr.children && ptr.children.length > 0) {
					this.stack.push(0);
					ptr = ptr.children[0];
				}
			}
		} else {
			ptr = null;
		}
	}
	this.ptr = ptr;
	return rtn;
};
