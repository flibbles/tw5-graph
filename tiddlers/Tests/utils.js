/*\

Sets up some utilities for testing.

\*/

var test = $tw.test = {};

/*
 * options can include the following:
 *   point: {x: Number, y: Number}
 */
test.dispatchGraphEvent = function(wiki, options) {
	options = options || {};
	var event = createEvent("doubletap");
	wiki.latestEngine.onevent({target: "graph", event: event, point: options.point});
};

test.dispatchNodeEvent = function(wiki, target, options) {
	options = options || {};
	var event = createEvent("doubletap");
	wiki.latestEngine.onevent({target: "node", id: target, event: event, point: options.point});
};

function createEvent(type) {
	if (typeof Event !== "undefined") {
		return new Event(type);
	} else {
		return {type: type};
	}
};
