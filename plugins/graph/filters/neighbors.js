/*\
title: $:/plugins/flibbles/graph/filters/neighbors.js
type: application/javascript
module-type: filteroperator

For each input tiddler, this returns a list of all neighbors it connects to considering the existing edge rules in graph.

\*/

"use strict";

var typeOperators = $tw.modules.getModulesByTypeAsHashmap("fieldtype");
var relinkPrefix = "$:/config/flibbles/relink/fields/" ;

exports.neighbors = function(source, operator, options) {
	var results = [];
	var fields = getDefaultFields(options.wiki);
	var formulas = getDefaultFormulas(options.wiki);
	source(function(tiddler, title) {
		if (tiddler) {
			results.push.apply(results, getFieldValues(tiddler, fields, options));
			results.push.apply(results, getFormulaValues(tiddler, formulas, options));
		}
	});
	return results;
};

function getFieldValues(tiddler, fields, options) {
	var results = []
	for (var i = 0; i < fields.length; i++) {
		var field = fields[i];
		var typeName = options.wiki.getTiddlerText(relinkPrefix + field, "list");
		var type = typeOperators[typeName] || typeOperators.list;
		results.push.apply(results, type.get(tiddler, field, options));
	}
	return results;
};

function getFormulaValues(tiddler, formulas, options) {
	var results = []
	for (var i = 0; i < formulas.length; i++) {
		var formula = formulas[i];
		var properties = options.wiki.getTiddler(formulasPrefix + formula);
		if (properties) {
			var filter = properties.fields.filter || "";
			var output = options.wiki.filterTiddlers(filter, options.widget, [tiddler.fields.title]);
			results.push.apply(results, output);
		}
	}
	return results;
};

var fieldsPrefix = "$:/config/flibbles/graph/edges/fields/";
function getDefaultFields(wiki) {
	var fields = [];
	wiki.eachShadowPlusTiddlers(function(tiddler, title) {
		if (title.startsWith(fieldsPrefix)) {
			fields.push(title.substr(fieldsPrefix.length));
		}
	});
	return fields;
};

var formulasPrefix = "$:/config/flibbles/graph/edges/formulas/";
function getDefaultFormulas(wiki) {
	var formulas = [];
	wiki.eachShadowPlusTiddlers(function(tiddler, title) {
		if (title.startsWith(formulasPrefix)) {
			formulas.push(title.substr(formulasPrefix.length));
		}
	});
	return formulas;
};

