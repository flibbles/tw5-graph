/*\

Type for transcribing application/json between text and field.

Focuses on keeping dataTiddler style pretty printing for text, but puts all
json on one line for fields.

\*/

"use strict";

exports.name = "application/json";

exports.toField = function(text) {
	if (!text) {
		return "";
	}
	try {
		return JSON.stringify(JSON.parse(text));
	} catch {
		return "{}";
	}
};

exports.fromField = function(text) {
	if (!text) {
		return "";
	}
	try {
		return JSON.stringify(JSON.parse(text), null, $tw.config.preferences.jsonSpaces);
	} catch {
		return "{}";
	}
};
