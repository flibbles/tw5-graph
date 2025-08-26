/*\
module-type: graphengine

Mock adapter to test switching adapters.

\*/

"use strict";

exports.name = "Also";

exports.properties = {
	nodes: {
		// We define the coordinates as strings. This tests that $node::$pos will keep coordinates as strings (or whatever) if engines want them that way.
		x: {type: "string", hidden: true},
		y: {type: "string", hidden: true},
		z: {type: "string", hidden: true}
	}
};
exports.init = function(element, objects) {
	$tw.test.latestEngine = this;
	this.element = element;
	this.objects = objects;
};

exports.update = function() {};
exports.destroy = function() {};

exports.dispatchEvent = function(params, variables) {
	this.onevent(params, variables);
};
