/*\

Widget for setting properties on graph objects.

\*/

"use strict";

var Widget = require("$:/core/modules/widgets/widget.js").widget;
var utils = require("../utils.js");
var Engines = $tw.modules.getModulesByTypeAsHashmap("graphengine");
var PropertyTypes = $tw.modules.getModulesByTypeAsHashmap("graphpropertytype");

var Properties = function(parseTreeNode, options) {
	this.initialise(parseTreeNode, options);
};

Properties.prototype = new Widget();

Properties.prototype.graphPropertiesWidget = true;

Properties.prototype.render = function(parent, nextSibling) {
	this.parentDomNode = parent;
	this.computeAttributes();
	this.execute();
	this.renderChildren(parent, nextSibling);
};

Properties.prototype.execute = function() {
	this.type = this.getAttribute("$for", "nodes");
	this.parentPropertiesWidget = utils.getParentProperties(this, this.type);
	this.filter = this.getAttribute("$filter");
	this.properties = this.getProperties();
	this.filterFunc = this.filter? this.wiki.compileFilter(this.filter): function(source) { return source; };
	this.makeChildWidgets();
};

Properties.prototype.refresh = function(changedTiddlers) {
	var changedAttributes = this.computeAttributes();
	this.propertiesChanged = false;
	if (changedAttributes["$for"]) {
		// If the $for changed, we need to refocus to the different object type.
		this.refreshSelf();
		return true;
	}
	if (propertiesChanged(changedAttributes)
	|| utils.refreshProperties(this.properties, this, this.type, changedTiddlers)
	|| changedAttributes["$tiddler"]
	|| changedAttributes["$field"]
	|| (this.dataTiddler
		&& changedTiddlers[this.dataTiddler]
		&& this.rawData !== getTiddlerString(this.wiki, this.dataTiddler, this.field))) {
		// Our styling attributes have changed, so everything this $style
		// affects needs to refresh.
		this.properties = this.getProperties();
		this.propertiesChanged = true;
	}
	// If we have a filterFunc, we need to worry about whether this style
	// applies to a different subset of its children objects or not.
	if (changedAttributes["$filter"]) {
		this.filter = this.getAttribute("$filter");
		this.filterFunc = this.filter? this.wiki.compileFilter(this.filter): function(source) { return source; };
	}
	return this.refreshChildren(changedTiddlers) || this.propertiesChanged;
};

Properties.prototype.getProperties = function() {
	this.field = this.getAttribute("$field");
	this.dataTiddler = this.getAttribute("$tiddler");
	if (!this.dataTiddler && this.field) {
		this.dataTiddler = this.getVariable("currentTiddler");
	}
	var styleObject = Object.create(null);
	if (this.dataTiddler) {
		var data;
		// We recall the actual raw data string so
		// we can see whether it changes later on.
		this.rawData = getTiddlerString(this.wiki, this.dataTiddler, this.field);
		if (!this.field || this.field === "text") {
			data = this.wiki.getTiddlerData(this.dataTiddler);
		} else {
			try {
				data = this.rawData? JSON.parse(this.rawData): {};
			} catch {
				data = {};
			}
		}
		for (var entry in data) {
			var datum = data[entry];
			// We only accept non-empty values
			if (datum && typeof datum === "string") {
				styleObject[entry] = datum;
			}
		}
	}
	for (var name in this.attributes) {
		if (name.charAt(0) !== '$' && this.attributes[name]) {
			styleObject[name] = this.attributes[name];
		}
	}
	return styleObject;
};

function getTiddlerString(wiki, title, field) {
	var tiddler = wiki.getTiddler(title);
	return tiddler && tiddler.getFieldString(field || "text");
};

Properties.prototype.catchGraphEvent = function(graphEvent, target, variables) {
	if (graphEvent.objectType === this.type
	&& this.filterFunc([target.id], this).length > 0) {
		var actions = this.properties[graphEvent.type];
		if (actions) {
			variables.targetTiddler = graphEvent.id;
			this.invokeActionString(actions, this, graphEvent.event, variables);
			return true;
		}
	}
	return false;
};

function propertiesChanged(changedAttributes) {
	for (var name in changedAttributes) {
		if (name.charAt(0) !== "$") {
			return true;
		}
	}
	return false;
};

exports.properties = Properties;
