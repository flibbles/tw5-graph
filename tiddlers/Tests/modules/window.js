/*\
module-type: mocklibrary

Mock window for testing on Node.JS and the sort

\*/

var Window = function(expect) {
	this.eventListeners = new Set();
	this.expect = expect;
};

exports.window = Window;

Window.prototype.addEventListener = function(type, method) {
	method.type = type;
	this.eventListeners.add(method);
};

Window.prototype.removeEventListener = function(type, method) {
	this.expect(method.type).toBe(type);
	this.eventListeners.delete(method);
};

Window.prototype.dispatchEvent = function(event) {
	for (var listener of this.eventListeners) {
		if (listener.type === event.type) {
			listener(event);
		}
	}
};
