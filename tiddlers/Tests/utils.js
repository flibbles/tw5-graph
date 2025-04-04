/*\

Sets up some utilities for testing.

\*/

var test = $tw.test = {};
var engineConfig = "$:/config/flibbles/graph/engine";
test.utils = require("$:/plugins/flibbles/graph/utils.js");
test.mock = $tw.modules.applyMethods("mocklibrary");

test.setSpies = function() {
	var TestAdapter = test.utils.getEngineMap().Test.prototype;
	return {
		update: spyOn(TestAdapter, "update").and.callThrough(),
		init: spyOn(TestAdapter, "init").and.callThrough(),
		destroy: spyOn(TestAdapter, "destroy").and.callThrough(),
		register: spyOn($tw.test.utils, "registerForDestruction"),
		window: spyOn($tw.test.utils, "window").and.returnValue(new test.mock.Window(expect))
	};
};

test.setGlobals = async function(wiki) {
	var pluginInfo = $tw.wiki.getPluginInfo("$:/plugins/flibbles/graph");
	wiki.addTiddlers(Object.values(pluginInfo.tiddlers));
	wiki.addTiddler($tw.wiki.getTiddler("$:/core/config/GlobalImportFilter"));
	// If I don't do this, then all those imported tiddlers will force a
	// refresh for any test I run. It will also cause any graph objects
	// to be destroyed AFTER any test with a graph is run.
	await $tw.test.flushChanges();
};

Object.defineProperty(test, 'adapterAlso', {
	get: function() {
		return test.utils.getEngineMap().Also.prototype;
	}
});

/*
 * Renders text into a widget tree.
 */
test.renderText = function(wiki, text) {
	if (!wiki.tiddlerExists(engineConfig)) {
		wiki.addTiddler({title: engineConfig, text: "Test"});
	}
	var parser = wiki.parseText("text/vnd.tiddlywiki", text);
	var widgetNode = wiki.makeWidget(parser);
	var container = $tw.fakeDocument.createElement("div");
	wiki.addEventListener("change", function(changes) {
		widgetNode.refreshChildren(changes);
	});
	widgetNode.render(container, null);
	return widgetNode;
};

test.renderGlobal = function(wiki, text) {
	return test.renderText(wiki, "\\import [subfilter{$:/core/config/GlobalImportFilter}]\n" + text + "\n");
};

test.renderAction = function(wiki, text) {
	var widgetNode = test.renderGlobal(wiki, text);
	// Action widgets should not be introducing content to the DOM.
	expect(widgetNode.parentDomNode.innerHTML).toBe("");
	return widgetNode;
};

test.flushChanges = function(ms) {
	return new Promise(function(resolve, reject) {
		// I'm using this instead of $tw.utils.nextTick(resolve) because
		// they use different queues or something? Putting events sequentually
		// on the two result in different run orders, which doesn't work for
		// testing action-delay.
		//$tw.utils.nextTick(resolve);
		setTimeout(resolve, ms || 0);
	});
};

var testResolve;

test.actionMethod = function(attributes) {
	if (testResolve) {
		var resolve = testResolve;
		testResolve = null;
		resolve(attributes);
	} else {
		fail("action-test called without $tw.test.actionMethod being spied upon or promised anything.");
	}
};

test.actionToBeCalled = function() {
	return new Promise((resolve, reject) => {
		testResolve = resolve;
	});
};

test.dispatchEvent = function(wiki, params, variables, callback) {
	var event = createEvent(params.type);
	variables = variables || {};
	var spy;
	if (test.actionMethod.calls) {
		spy = test.actionMethod;
		spy.calls.reset();
	} else {
		spy = spyOn(test, "actionMethod");
	}
	if (callback) {
		spy.and.callFake(callback);
	}
	params.event = event;
	test.latestEngine.dispatchEvent(params, variables, expect);
};

function createEvent(type) {
	if (typeof Event !== "undefined") {
		return new Event(type);
	} else {
		return {type: type};
	}
};

test.fetchGraphObjects = function(widget) {
	var objects = {};
	var searchChildren = function(children) {
		for (var i = 0; i < children.length; i++) {
			var widget = children[i];
			var type = widget.graphObjectType;
			if (type && widget.changed) {
				objects[type] = objects[type] || Object.create(null);
				widget.setProperties({});
				objects[type][widget.id] = widget.getGraphObject();
			}
			if (widget.children) {
				searchChildren(widget.children);
			}
		}
	};
	searchChildren([widget]);
	return objects;
};
