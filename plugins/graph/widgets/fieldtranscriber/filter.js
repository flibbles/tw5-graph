/*\

Type for transcribing application/x-tiddler-filter between text and field.

Changes \n into "  " between runs to mitigate the need for multilines.
However, it's impossible to guarantee a single line filter if newlines are
used in operands.

\*/

"use strict";

exports.name = "application/x-tiddler-filter";

exports.toField = function(text) {
	return filterWhitespaceWalk(text, function(start, end) {
		var substr = text.substring(start, end);
		var change = substr.replaceAll("\n", "  ");
		return substr !== change ? change: null;
	}).trim();
};

exports.fromField = function(text) {
	return filterWhitespaceWalk(text, function(start, end) {
		var substr = text.substring(start, end);
		var change = substr.replaceAll("  ", "\n");
		return substr !== change ? change: null;
	});
};

var brackets = { "{": "}", "[": "]", "<": ">" };

function filterWhitespaceWalk(filterString, method) {
	var p = 0, replaceHead = 0, replacements = [], match, nextBracketPos;
	var whitespaceRegExp = /(\s+)/mg;
	var operandRegExp = /((?:\+|\-|~|=|\:(\w+)(?:\:([\w\:, ]*))?)?)(?:(\[)|(?:"([^"]*)")|(?:'([^']*)')|([^\s\[\]]+))/mg;
	while (p < filterString.length) {
		whitespaceRegExp.lastIndex = p;
		match = whitespaceRegExp.exec(filterString);
		if (match && match.index === p) {
			var end = p + match[0].length;
			var replacement = method(p, end);
			if (replacement !== null) {
				replacements.push(filterString.substring(replaceHead, p));
				replacements.push(replacement);
				replaceHead = end;
			}
			p = end;
		}
		if (p < filterString.length) {
			operandRegExp.lastIndex = p;
			match = operandRegExp.exec(filterString);
			if (!match || match.index !== p) {
				// Broken filter
				return filterString;
			}
			if (match[1]) {
				// Skip the named prefix
				p += match[1].length;
			}
			if (match[4]) {
				// It's a filter operation. Skip by [...]
				if (filterString.charAt(p++) !== "[") {
					return filterString;
				}
				do {
					if(filterString.charAt(p) === "!") {
						filterString.charAt(p++);
					}
					// Get the operator name
					nextBracketPos = filterString.substring(p).search(/[\[\{<\/]/);
					if(nextBracketPos === -1) {
						return filterString;
					}
					nextBracketPos += p;
					var bracket = filterString.charAt(nextBracketPos);
					nextBracketPos = filterString.indexOf(brackets[bracket], p);
					if (nextBracketPos === -1) {
						return filterString;
					}
					p = nextBracketPos + 1;
				} while (filterString.charAt(p++) !== "]");
			} else {
				p = match.index + match[0].length;
			}
		}
	}
	if (replacements.length > 0) {
		replacements.push(filterString.substr(replaceHead));
		return replacements.join("");
	}
	return filterString;
};
