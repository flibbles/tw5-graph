/*\
title: $:/plugins/flibbles/graph/propertytypes/actions.js
type: application/javascript
module-type: graphpropertytype

Defines behavior to be taken in the event that particular action is called.

\*/

"use strict";

exports.name = "actions";

exports.type = "wikitext";

exports.toProperty = function(info, value) {
	return value? true: null;
};
