/*\
title: $:/plugins/flibbles/graph/fieldtypes/filter.js
type: application/javascript
module-type: fieldtype

\*/

"use strict";

exports.name = "filter";

exports.get = function(tiddler, field, options) {
	// We optimize by storing a cache of compiled filters for this tiddler
	// We will need them a lot, especially if our graphs are doing neighbor
	// evaluation, which will call on these filters with every single change.
	var fieldCache = options.wiki.getCacheForTiddler(tiddler.fields.title, "filter-fields", function() {
		return Object.create(null);
	});
	var method = fieldCache[field];
	if (method === undefined) {
		// We haven't cached this filter function yet
		var filterStr = tiddler.getFieldString(field);
		fieldCache[field] = method = getFilterFunction(filterStr, options.wiki);
	}
	return method.call(options.wiki, null, options.widget);
};

exports.add = function(tiddler, field, value, options) {
	var filterString = tiddler && tiddler.getFieldString(field);
	var changed = false;
	// We don't want to add the title if it's already a filter result.
	while (options.wiki.filterTiddlers(filterString, options.widget).indexOf(value) < 0) {
		changed = true;
		var filterTree = options.wiki.parseFilter(filterString);
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
	if (changed) {
		return filterString;
	}
};

exports.remove = function(tiddler, field, value, options) {
	var filterString = tiddler && tiddler.getFieldString(field);
	var changed = false;
	// We don't want to remove a title that's not already there
	while (filterString && options.wiki.filterTiddlers(filterString, options.widget).indexOf(value) >= 0) {
		changed = true;
		var filterTree = options.wiki.parseFilter(filterString);
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
		filterString = reassembleFilter(filterTree, this.actionClean);
		// Now we do it again to make sure it was actually removed
	}
	if (changed) {
		return filterString;
	}
};

// This returns a compiled filter given a string. It optimizes where it can.
function getFilterFunction(filterStr, wiki) {
	var method;
	if (filterStr) {
		method = wiki.compileFilter(filterStr);
		// A further optimization here.
		// If the filter is very simple, as in nothing by titles,
		// then we can just call it now and cache the output,
		// because it will never change.
		if (filterStr.indexOf("[") < 0) {
			var results = method.call(wiki);
			method = function() { return results; };
		}
	} else {
		method = function() { return []; };
	}
	return method;
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

function reassembleFilter(parseTree, clean) {
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
	if (clean && fragments.length == 0) {
		return undefined;
	}
	return fragments.join("");
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
