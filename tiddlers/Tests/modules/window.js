/*\
module-type: mocklibrary

Mock window for testing on Node.JS and the sort

\*/

var EventHandler = require("./eventHandler.js").EventHandler;

var Window = function() { };

$tw.utils.extend(Window.prototype, EventHandler.prototype);

exports.Window = Window;
