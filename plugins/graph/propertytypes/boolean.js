/*\

Defines behavior for boolean types in graph engine properties.

\*/

"use strict";

exports.name = "boolean";

var falses = {
	no: true,
	"false": true,
	"0": true,
	n: true,
	f: true,
	'': true,
	' ': true
};

exports.toProperty = function(info, value) {
	return !falses[value.toLowerCase()];
};
