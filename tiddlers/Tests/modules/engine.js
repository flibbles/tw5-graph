/*\
module-type: graphengineadapter

Mock engine for running tests.

\*/

"use strict";

function TestAdapter(wiki) {
	wiki.latestEngine = this;
};

TestAdapter.prototype.initialize = function(element, objects) {
	this.element = element;
	this.objects = objects;
};

TestAdapter.prototype.update = function(objects) {
	for (var category in objects) {
		this.objects[category] = this.objects[category] || Object.create(null);
		$tw.utils.extend(this.objects[category], objects[category]);
	}
};

TestAdapter.prototype.setPhysics = function(value) {};
TestAdapter.prototype.render = function(value) {};

exports.Test = TestAdapter;
