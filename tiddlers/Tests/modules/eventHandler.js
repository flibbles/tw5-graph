/*\
module-type: mocklibrary

Mock window for testing on Node.JS and the sort

\*/

var EventHandler = function() { };

EventHandler.prototype.addEventListener = function(type, method) {
	if (!this.eventListeners) {
		this.eventListeners = new Set();
	}
	method.type = type;
	this.eventListeners.add(method);
};

EventHandler.prototype.removeEventListener = function(type, method) {
	if (this.eventListeners && method.type === type) {
		this.eventListeners.delete(method);
	}
};

EventHandler.prototype.dispatchEvent = function(event) {
	if (this.eventListeners) {
		for (var listener of this.eventListeners) {
			if (listener.type === event.type) {
				if (typeof listener === "function") {
					listener(event);
				} else {
					listener.handleEvent(event);
				}
			}
		}
	}
};

exports.EventHandler = EventHandler;
