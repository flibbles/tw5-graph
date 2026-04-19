/*\
module-type: graphengine

Mock adapter to test switching adapters.

\*/

"use strict";

exports.name = "Also";

exports.properties = { };

Object.defineProperty(exports.properties, "nodes", {
	enumerable: true,
	configurable: true,
	get() { return { }}
});

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
