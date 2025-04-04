/*\
module-type: mocklibrary

Mock window for testing on Node.JS and the sort

\*/

var EventHandler = require("./eventHandler.js").EventHandler;
var Document = require("./document.js").Document;

var Window = function() {
	this.document = new Document(this);
};

$tw.utils.extend(Window.prototype, EventHandler.prototype);

exports.Window = Window;
