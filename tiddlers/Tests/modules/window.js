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

Window.prototype.EventTarget = EventTarget;

exports.Window = Window;
