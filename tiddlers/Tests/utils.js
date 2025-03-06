/*\

Sets up some utilities for testing.

\*/

var test = $tw.test = {};
var engineConfig = "$:/config/flibbles/graph/engine";
test.utils = require("$:/plugins/flibbles/graph/utils.js");

test.setSpies = function() {
	return {
		update: spyOn($tw.test.adapter, "update").and.callThrough(),
		init: spyOn($tw.test.adapter, "init").and.callThrough(),
		destroy: spyOn($tw.test.adapter, "destroy").and.callThrough(),
		register: spyOn($tw.test.utils, "registerForDestruction"),
		window: spyOn($tw.test.utils, "window").and.returnValue({
			set: new Set(),
			addEventListener: function(type, method) {
				method.type = type;
				this.set.add(method);
			},
			removeEventListener: function(type, method) {
				expect(method.type).toBe(type);
				this.set.delete(method);
			}
		})
	};
};

Object.defineProperty(test, 'adapter', {
	get: function() {
		return test.utils.getEngineMap().Test.prototype;
	}
});

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

test.dispatchEvent = function(wiki, params, callback) {
	var event = createEvent(params.type);
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
	test.latestEngine.onevent(params);
};

test.fetchGraphObjects = function(widget) {
	var objects = {};
	var searchChildren = function(children) {
		for (var i = 0; i < children.length; i++) {
			var widget = children[i];
			var type = widget.graphObjectType;
			if (type && widget.changed) {
				objects[type] = objects[type] || Object.create(null);
				widget.setStyle({}, (type, key, x) => x);
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

/*
 * options can include the following:
 *   point: {x: Number, y: Number}
 */
test.dispatchGraphEvent = function(wiki, options) {
	options = options || {};
	var event = createEvent("doubletap");
	wiki.latestEngine.onevent({event: event, point: options.point});
};

test.dispatchNodeEvent = function(wiki, target, options) {
	options = options || {};
	var event = createEvent("doubletap");
	wiki.latestEngine.onevent({objectType: "nodes", id: target, event: event, point: options.point});
};

function createEvent(type) {
	if (typeof Event !== "undefined") {
		return new Event(type);
	} else {
		return {type: type};
	}
};
