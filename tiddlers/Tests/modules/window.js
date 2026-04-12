/*\
module-type: mocklibrary

Mock window for testing on Node.JS and the sort

\*/

var EventTarget = require("./eventTarget.js").EventTarget;
var Document = require("./document.js").Document;

var Window = function() {
	this.document = new Document(this);
};

$tw.utils.extend(Window.prototype, EventTarget.prototype);

// Defaults just so some tests don't always have to bother setting these.
Window.prototype.innerHeight = 50;
Window.prototype.innerWidth = 50;

Window.prototype.EventTarget = EventTarget;

// Dummy option element which we can use to determine what strings are valid
// CSS colors.
Window.prototype.Option = function() {
	var option = this;
	this.style = {};
	this.testColors = {red: true, blue: true};
	Object.defineProperty(this.style, "color", {
		get() { return this._color; },
		set(str) {
			if (option.testColors[str]) {
				this._color = str;
			}
		}
	});
}

exports.Window = Window;
