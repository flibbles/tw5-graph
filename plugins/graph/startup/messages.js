/*\
title: $:/plugins/flibbles/graph/startup/messages.js
type: application/javascript
module-type: startup

Introduces some handling of custom messages that TW5-Graph needs.

DO NOT USE "tm-download-raw"! It's flimsy, poorly tested, and exists only
because there is no other way to download a binary file in Tiddlywiki.

As soon as I find a better way to do it, I'm deleting this file.

\*/

"use strict";

exports.name = "graph-messages";
exports.before = ["startup"];
exports.synchronous = true;

exports.startup = function() {
	var CoreSaver = $tw.SaverHandler;
	$tw.SaverHandler = function() {
		CoreSaver.apply(this, arguments);
		if ($tw.browser) {
			var self = this;
			$tw.rootWidget.addEventListener("tm-download-raw", function(event) {
				return download(event, self);
			});
		}
	}
	$tw.SaverHandler.prototype = CoreSaver.prototype;
};

function download(event, saverHandler, variables) {
	var title = event.param;
	var wiki = event.widget.wiki;
	var variables = event.paramObject;
	const element = document.createElement("a");
	var data = wiki.getTiddlerText(title);
	element.setAttribute("download", variables.filename);
	element.setAttribute("href", "data:" + variables.type + ";base64," + data);
	var click = new MouseEvent("click");
	element.dispatchEvent(click);
	return true;
};
