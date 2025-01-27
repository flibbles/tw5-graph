/*\
module-type: graphengineadapter

Mock engine for running tests.

\*/

"use strict";

function TestAdapter(wiki) {
	wiki.latestEngine = this;
};

TestAdapter.prototype.initialize = function(element, nodes, edges) {
	this.element = element;
	this.nodes = nodes;
	this.edges = edges;
};

TestAdapter.prototype.setPhysics = function(value) {};
TestAdapter.prototype.render = function(value) {};
TestAdapter.prototype.modify = function(nodes, edges) {};

exports.Test = TestAdapter;
