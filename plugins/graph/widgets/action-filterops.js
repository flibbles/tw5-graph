/*\
title: $:/plugins/flibbles/graph/widgets/action-filterops.js
type: application/javascript
module-type: widget

Action widget that creates a modal to select an existing tiddler, or specify a new one. After dialog is confirmed, it will execute any nested actions it contains.

\*/

"use strict";

var Widget = require("$:/core/modules/widgets/widget.js").widget;

var OpsWidget = function(parseTreeNode, options) {
	this.initialise(parseTreeNode, options);
};

OpsWidget.prototype = new Widget();

OpsWidget.prototype.render = function(parent, nextSibling) {
	this.computeAttributes();
	this.execute();
};

OpsWidget.prototype.execute = function() {
	this.actionTiddler = this.getAttribute("$tiddler", this.getVariable("currentTiddler"));
	this.actionField = this.getAttribute("$field");
	this.actionAdd = this.getAttribute("$add");
	this.actionRemove = this.getAttribute("$remove");
	this.actionTimestamp = this.getAttribute("$timestamp","yes") === "yes";
};

OpsWidget.prototype.refresh = function(changedTiddlers) {
	var changedAttributes = this.computeAttributes();
	if ($tw.utils.count(changedAttributes) > 0) {
		this.refreshSelf();
		return true;
	}
	return this.refreshChildren(changedTiddlers);
};

OpsWidget.prototype.invokeAction = function(triggeringWidget, event) {
	var tiddler = this.wiki.getTiddler(this.actionTiddler),
		hasChanged = false;
	if (this.actionTiddler) {
		var filterString = tiddler.fields[this.actionField];
		if (this.actionAdd) {
			filterString = this.addValue(filterString, this.actionAdd);
		}
		if (this.actionRemove) {
			filterString = this.removeValue(filterString, this.actionRemove);
		}
		this.wiki.setText(this.actionTiddler, this.actionField, undefined, filterString, {});
	}
};

OpsWidget.prototype.addValue = function(filterString, value) {
	// We don't want to add the title if it's already a filter result.
	while (this.wiki.filterTiddlers(filterString, this).indexOf(value) < 0) {
	  var filterTree = this.wiki.parseFilter(filterString);
	  var found = false;
	  // Search backwards for any explicit removal of the target Ref
	  // Otherwise, we might get `... -value value`
	  for (let i = filterTree.length-1; i>= 0; i--) {
		var run = filterTree[i];
		var title = runIsSingleTitle(run);
		if (title !== null) {
			if (run.prefix === "-" && title === value) {
			  // We found an explicit removal. Remove the removal.
			  filterTree.splice(i, 1);
			  found = true;
			  break;
			}
		} else if (run.prefix) {
			// This filter has gotten complicated.
			// Forget searching for explicit removals.
			break;
		}
	  }
	  if (!found) {
		// We didn't find an explicit removal (expected),
		// so we add the title to the list.
		filterTree.push({
			prefix: "",
			operators: [{operator: "title", operands: [{text: value}]}]});
	  }
	  filterString = reassembleFilter(filterTree);
	  // Now we go back and try again to make sure it actually took.
	}
	return filterString;
};

OpsWidget.prototype.removeValue = function(filterString, value) {
	// We don't want to remove a title that's not already there
	while (filterString && this.wiki.filterTiddlers(filterString, this).indexOf(value) >= 0) {
		var filterTree = $tw.wiki.parseFilter(filterString);
		var found = false;
		for (let i = filterTree.length-1; i >= 0; i--) {
			let run = filterTree[i];
			let title = runIsSingleTitle(run);
			if (title !== null) {
				if (!run.prefix && title === value) {
					// This is the title we're looking for. Remove it.
					filterTree.splice(i, 1);
					found = true;
					break;
				}
			} else if (run.prefix) {
				break;
			}
		}
		if (!found) {
			// We couldn't find it. So it must be a complicated filter.
			// We'll put in a manual removal.
			filterTree.push({
				prefix: "-",
				operators: [{operator: "title", operands: [{text: value}]}]});
		}
		filterString = reassembleFilter(filterTree);
		// Now we do it again to make sure it was actually removed
	}
	return filterString;
};

// If this is a single title, return the title, otherwise null
function runIsSingleTitle(run) {
	if (run.operators.length === 1 && !run.namedPrefix) {
		var op = run.operators[0];
		if (op.operator === "title"
		&& op.operands.length === 1
		&& !op.suffix
		&& !op.prefix) {
			var operand = op.operands[0];
			if (!operand.variable && !operand.indirect) {
				return operand.text;
			}
		}
	}
	return null;
};

function reassembleFilter(parseTree) {
	// This will hold all of the filter parts
	const fragments = [];
	// Rebuild the filter.
	for (var i = 0; i < parseTree.length; i++) {
		var run = parseTree[i];
		if (fragments.length > 0) {
			fragments.push(" ");
		}
		fragments.push(run.prefix);
		let title = runIsSingleTitle(run);
		if (title) {
			fragments.push(bestQuoteFor(title));
		} else if (run.operators.length > 0) {
			fragments.push("[");
			for (let j = 0; j < run.operators.length; j++) {
				let op = run.operators[j];
				let firstOperand = true;
				if (op.prefix) {
					fragments.push(op.prefix);
				}
				if (op.operator !== "title" || op.suffix) {
					fragments.push(op.operator);
				}
				if (op.suffix) {
					fragments.push(':', op.suffix);
				}
				if (op.regexp) {
					fragments.push("/", op.regexp.source, "/");
					if (op.regexp.flags) {
						fragments.push("(", op.regexp.flags, ")");
					}
				} else {
					for (let k = 0; k < op.operands.length; k++) {
						let operand = op.operands[k];
						if (!firstOperand) {
							fragments.push(',');
						}
						firstOperand = false;
						if (operand.variable) {
							fragments.push('<', operand.text, '>');
						} else if (operand.indirect) {
							fragments.push('{', operand.text, '}');
						} else {
							fragments.push('[', operand.text, ']');
						}
					}
				}
			}
			fragments.push(']');
		}
	}
	// Return compiled filter string, if there is one
	if (fragments.length > 0) {
		return fragments.join("");
	}
	return undefined;
};

function bestQuoteFor(title) {
	if (/^[^\s\[\]\-+~=:'"][^\s\[\]]*$/.test(title)) {
		return title;
	}
	if (title.indexOf("]") < 0) {
		return "[[" + title + "]]";
	}
	if (title.indexOf("'") < 0) {
		return "'" + title + "'";
	}
	return '"' + title + '"';
};


exports["action-filterops"] = OpsWidget;
