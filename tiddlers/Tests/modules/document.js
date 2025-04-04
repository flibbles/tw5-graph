/*\
module-type: mocklibrary

Mock window for testing on Node.JS and the sort

\*/

var EventHandler = require("./eventHandler.js").EventHandler;

var Document = function(window) {
	this.body = this.createElement("body");
	this.defaultView = window;
};

$tw.utils.extend(Document.prototype, $tw.fakeDocument);

exports.Document = Document;
