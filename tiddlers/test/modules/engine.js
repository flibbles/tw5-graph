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

TestAdapter.prototype.update = function(nodes, edges) {
	$tw.utils.extend(this.nodes, nodes);
	$tw.utils.extend(this.edges, edges);
};

TestAdapter.prototype.setPhysics = function(value) {};
TestAdapter.prototype.render = function(value) {};

exports.Test = TestAdapter;
