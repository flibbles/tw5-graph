/*\
module-type: graphengine

Mock adapter for running tests.

\*/

"use strict";

exports.name = "Test";

exports.properties = {
	graph: {
		focus: {type: "actions"},
		blur: {type: "actions"},
		zoom: {type: "boolean"},
		physics: {type: "boolean", default: true},
		hierarchy: {type: "string", default: true},
		navigation: {type: "boolean", default: false},
		addNode: {type: "actions", variables: ['x', 'y']},
		addEdge: {type: "actions", variables: ['fromTiddler', 'toTiddler']},
		doubleclick: {type: "actions", variables: ['x', 'y', 'xView', 'yView']}
	},
	nodes: {
		color: {type: "color"},
		size: {type: "number", min: 0},
		label: {type: "string"},
		hidden: {type: "boolean"},
		image: {type: "image"},
		physics: {type: "boolean"},
		shape: {type: "enum", values: ["box", "circle", "star"]},
		x: {type: "number", hidden: true},
		y: {type: "number", hidden: true},
		delete: {type: "actions"},
		hover: {type: "actions", variables: ['x', 'y', 'xView', 'yView']},
		blur: {type: "actions"},
		drag: {type: "actions", variables: ['x', 'y']},
		free: {type: "actions", variables: ['x', 'y']}
	},
	edges: {
		width: {type: "number"},
		delete: {type: "actions"}
	}
};

exports.init = function(element, objects) {
	$tw.test.latestEngine = this;
	this.element = element;
	this.objects = objects;
};

exports.update = function(objects) {
	for (var category in objects) {
		this.objects[category] = this.objects[category] || Object.create(null);
		$tw.utils.extend(this.objects[category], objects[category]);
	}
};

exports.destroy = function() {
	if ($tw.test.latestEngine === this) {
		$tw.test.latestEngine = null;
	}
};

// This method does a lot of sanity checking to make sure all our tests
// conform to common engine standards.
exports.dispatchEvent = function(params, variables) {
	var category = this.properties[params.objectType];
	if (!category) {
		throw new Error("Graph event dispatched without object Type");
	}
	var typeData = category[params.type];
	if (!typeData) {
		throw new Error(`Graph event is of unrecognized type: ${params.objectType}##${params.type}`);
	}
	var expected = typeData.variables || [];
	if (!objectMatchesKeys(variables, expected)) {
		throw new Error(`Graph event has incorrect variables: ${params.objectType}##${params.type}${JSON.stringify(variables)} instead of ${expected}`);
	}
	this.onevent(params, variables);
};

function objectMatchesKeys(object, keyArray) {
	object = object || {};
	var count = 0;
	if ($tw.utils.count(object) !== keyArray.length) {
		return false;
	}
	for (var index in keyArray) {
		if (!$tw.utils.hop(object, keyArray[index])) {
			return false;
		}
	}
	return true;
};
