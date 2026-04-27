/*\
title: $:/plugins/flibbles/graph/utils/propertyholder.js
type: application/javascript
module-type: graphutils

Class which holds properties, and evaluates their compiled value based on
a supplied set of definitions.

\*/

var Holder = exports.PropertyHolder = {};

var PropertyTypes = $tw.modules.getModulesByTypeAsHashmap("graphpropertytype");

/*
Takes an object of properties and converts them into values ready to be passed
to the engine, using the catalog and this as the context to define them.
*/
Holder.evaluateProperties = function(properties, definitions) {
	var output = Object.create(null);
	// We set the definition and properties to the holder,
	// because some properties may need to evaluate others
	// and the holder will need to remember its rules and properties
	// to do that nested evaluation without passing it around
	this.definitions = definitions;
	this.properties = properties;
	for (var key in this.properties) {
		var value = this.evaluateProperty(key);
		if (value !== null) {
			output[key] = value;
		}
	}
	return output;
};

Holder.evaluateProperty = function(propertyName) {
	var rule = this.definitions[propertyName],
		value = this.properties[propertyName];
	if (rule) {
		if (value === undefined) {
			value = rule.default;
		}
		if (rule && PropertyTypes[rule.type]) {
			 value = PropertyTypes[rule.type].toProperty(rule, value, {wiki: this.wiki, widget: this});
		} else {
			value = value || null;
		}
	}
	return value;
};

/*
Checks if any property in the holder needs to check for refresh, and returns
true if any do need to refresh.
*/
Holder.refreshProperties = function(changedTiddlers) {
	for (var name in this.properties) {
		if (this.refreshProperty(name, changedTiddlers)) {
			return true;
		}
	}
	return false;
};

Holder.refreshProperty = function(propertyName, changedTiddlers) {
	var rule = this.definitions[propertyName];
	if (rule) {
		var type = PropertyTypes[rule.type],
			raw = this.properties[propertyName];
		if (raw === undefined) {
			raw = rule.default;
		}
		if (type
		&& type.refresh
		&& type.refresh(rule, raw, changedTiddlers, this)) {
			return true;
		}
	}
	return false;
};
