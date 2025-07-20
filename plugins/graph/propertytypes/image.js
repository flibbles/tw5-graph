/*\

Defines images types, and manages fetching a url from titles.

\*/

"use strict";

exports.name = "image";

exports.type = "title";

exports.toProperty = function(info, value, options) {
	var tiddler = options.widget.wiki.getTiddler(value);
	if (!tiddler) {
		// It does not appear to be a real tiddler,
		// so let's treat it like a real URL.
		return value;
	}
	var output = getTiddlerUri(value, options.widget);
	if (output.uri === undefined && output.widget) {
		var container = $tw.fakeDocument.createElement("div");
		output.widget.render(container, null);
		var text = container.innerHTML;
		if (text.indexOf("<svg") < 0) {
			// Not an image as far as we can tell. Ignore the input.
			output.uri = null;
		} else {
			text = injectNamespace(text);
			text = injectStyle(text, options.widget);
			output.uri = "data:image/svg+xml," + encodeURIComponent(text);
		}
	}
	return output.uri;
};

exports.refresh = function(info, value, changedTiddlers, widget) {
	if (changedTiddlers[value]) {
		return true;
	}
	var tiddler = widget.wiki.getTiddler(value);
	if (tiddler) {
		var output = getTiddlerUri(value, widget);
		if (output.widget && output.widget.refresh(changedTiddlers)) {
			output.uri = undefined;
			return true;
		}
	}
	return false;
};

function getTiddlerUri(title, widget) {
	var wiki = widget.wiki;
	return wiki.getCacheForTiddler(title, "graph-image", function() {
		var tiddler = wiki.getTiddler(title);
		var output = {};
		if(wiki.isImageTiddler(title)) {
			// Check if it is an image tiddler
			var type = tiddler.fields.type,
				text = tiddler.fields.text,
				_canonical_uri = tiddler.fields._canonical_uri,
				typeInfo = $tw.config.contentTypeInfo[type] || {},
				deserializerType = typeInfo.deserializerType || type;
			if(text) {
				// Render the appropriate element for the image type by looking up the encoding in the content type info
				var encoding = typeInfo.encoding || "utf8";
				if (encoding === "base64") {
					// .pdf .png .jpg etc.
					output.uri = "data:" + deserializerType + ";base64," + text;
				} else {
					// .svg .tid .xml etc.
					output.uri = "data:" + deserializerType + ";" + encoding + "," + encodeURIComponent(text);
				}
			} else if(_canonical_uri) {
				output.uri = _canonical_uri;
			} else {
				// This must be a lazily loaded tiddler. We don't suppor those yet.
				output.uri = null;
			}
		} else {
			// We assume it is wikitext trying to make an svg
			var parser = wiki.parseTiddler(title, {parseAsInline: true});
			var widgetNode = wiki.makeWidget(parser, {parentWidget: widget});
			output.widget = widgetNode;
		}
		return output;
	});
};

function injectNamespace(text) {
	if (text.indexOf("xmlns=") < 0) {
		// wikitext svg does not need namespacing, but data URIs do
		text = text.replace("<svg", '<svg xmlns="http://www.w3.org/2000/svg"');
	}
	return text;
};

function injectStyle(text, graphWidget) {
	var fill = graphWidget.getColor("nodeColor");
	if (fill) {
		return text.replace(/svg[^>]*>/, "$&<style>fill:" + fill + ";</style>");
	}
	return text;
};
