/*\

Sets up some utilities for testing.

\*/

var test = $tw.test = {};
var engineConfig = "$:/config/flibbles/graph/engine";

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

test.flushChanges = function() {
	return new Promise(function(resolve, reject) {
		$tw.utils.nextTick(resolve);
	});
};

test.actionMethod = function(attributes) {
	fail("action-test called without $tw.test.actionMethod being spied upon.");
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
	wiki.latestEngine.onevent(params);
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
