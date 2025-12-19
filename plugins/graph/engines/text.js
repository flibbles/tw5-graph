/*\
A simple read-only engine that renders the graph as Mermaid text via the
`graph.to-mermaid` macro. It is intended for non-interactive display.
\*/

"use strict";

exports.name = "Text";

// Cache macro lookup once per module load
var macros = $tw.modules.getModulesByTypeAsHashmap("macro");
var mermaidMacro = macros["graph.to-mermaid"];

// Read-only engine: no interactive properties declared.
exports.properties = {
	graph: {},
	nodes: {},
	edges: {}
};

function findRenderedTiddlerTitle(element) {
	try {
		var el = element;
		while (el) {
			if (el.getAttribute) {
				var graphTitle = el.getAttribute("data-graph-title");
				if (graphTitle) return graphTitle;
				var tiddlerTitle = el.getAttribute("data-tiddler-title");
				if (tiddlerTitle) return tiddlerTitle;
			}
			el = el.parentNode;
		}
	} catch(e) {}
	return null;
}

exports.init = function(element, objects, options) {
	this.element = element;
	this.objects = objects || {};
	this.wiki = options && options.wiki;
	this.renderOnce();
};

exports.update = function(objects) {
	// Merge new objects if needed, and re-render.
	this.objects = this.objects || {};
	for (var k in objects) {
		this.objects[k] = objects[k];
	}
	this.renderOnce();
};

exports.destroy = function() {
	if (this.element) {
		this.element.textContent = "";
	}
};

exports.dispatchEvent = function(params, variables) {
	// No interactive events; do nothing.
	if (this.onevent) {
		this.onevent(params, variables);
	}
};

exports.renderOnce = function() {
	if (!this.wiki || !this.element) return;
	var title = findRenderedTiddlerTitle(this.element) || "$:/graph/Default";
	if (!mermaidMacro || !mermaidMacro.run) {
		this.element.innerHTML = "Error: graph.to-mermaid macro missing";
		return;
	}
	// Call the macro directly with a minimal context
	var context = {
		wiki: this.wiki,
		getVariable: function(name) {
			if (name === "currentTiddler") return title;
			return "";
		}
	};
	var out = mermaidMacro.run.call(context, title);
	this.element.innerHTML = out;
};
