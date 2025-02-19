/*\
module-type: graphengineadapter

Mock adapter for running tests.

\*/

"use strict";

exports.name = "Test";

exports.initialize = function(element, objects) {
	$tw.test.latestEngine = this;
	this.element = element;
	this.objects = objects;
};

exports.render = function() {};

exports.update = function(objects) {
	for (var category in objects) {
		this.objects[category] = this.objects[category] || Object.create(null);
		$tw.utils.extend(this.objects[category], objects[category]);
	}
};
