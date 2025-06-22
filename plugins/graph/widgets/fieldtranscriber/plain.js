/*\

Type for transcribing text/plain between text and field.

\*/

"use strict";

exports.name = "text/plain";

exports.fromField = exports.toField = function(text) { return text; };
