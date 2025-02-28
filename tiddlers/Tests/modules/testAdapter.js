/*\
module-type: graphengine

Mock adapter for running tests.

\*/

"use strict";

exports.name = "Test";

exports.properties = {
	graph: {
		physics: {type: "boolean", default: true}
	},
	nodes: {
		color: {type: "color"},
		size: {type: "number", min: 0},
		label: {type: "string"},
		hidden: {type: "boolean"},
		x: {type: "number", hidden: true},
		y: {type: "number", hidden: true}
	},
	edges: {
		width: {type: "number"}
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
