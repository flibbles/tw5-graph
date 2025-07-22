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
	var cache = options.widget.wiki.getGlobalCache("graph-image", function() {
		return Object.create(null);
	});
	if (!cache[value]) {
		var output = getTiddlerUri(value, options.widget);
		if (output.uri === undefined && output.widget) {
			var container = $tw.fakeDocument.createElement("div");
			output.widget.render(container, null);
			var svg = findSVGElement(container);
			if (!svg) {
				// Not an image as far as we can tell. Ignore the input.
				output.uri = null;
			} else {
				injectNamespace(svg);
				// wikitext images may benefit from colors. svg images should too, but let's
				// not worry about that right now.
				output.widget.color = options.widget.getColor("nodeColor");
				injectStyle(svg, output.widget);
				output.uri = "data:image/svg+xml," + encodeURIComponent(container.innerHTML);
			}
		}
		cache[value] = output;
	}
	return cache[value].uri;
};

exports.refresh = function(info, value, changedTiddlers, widget) {
	if (changedTiddlers[value]) {
		return true;
	}
	var graphWidget = getGraphWidget(widget);
	var tiddler = graphWidget.wiki.getTiddler(value);
	if (tiddler) {
		var output = getTiddlerUri(value, graphWidget);
		if (output.widget && output.widget.refresh(changedTiddlers)) {
			output.uri = undefined;
			return true;
		}
	}
	// Now we need to check whether the color for this image has changed
	if (output && output.widget) {
		var newColor = graphWidget.getColor("nodeColor");
		if (newColor !== output.widget.color) {
			output.color = newColor;
			return true;
		}
	}
	return false;
};

function getGraphWidget(widget) {
	while (widget && !widget.getColor) {
		widget = widget.parentWidget;
	}
	return widget;
};

function getTiddlerUri(title, widget) {
	var wiki = widget.wiki;
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
		output.widget = wiki.getCacheForTiddler(title, "graph-image", function() {
			var parser = wiki.parseTiddler(title, {parseAsInline: true});
			return wiki.makeWidget(parser, {parentWidget: widget});
		});
	}
	return output;
};

function findSVGElement(element) {
	if (element.tag === "svg") {
		return element;
	}
	if (element.children) {
		for (var i = 0; i < element.children.length; i++) {
			var found = findSVGElement(element.children[i]);
			if (found) {
				return found;
			}
		}
	}
	return null;
};

function injectNamespace(svg) {
	// wikitext svg does not need namespacing, but data URIs do
	svg.setAttribute("xmlns", "http://www.w3.org/2000/svg");
};

function injectStyle(svg, widget) {
	if (widget.color) {
		var style = $tw.fakeDocument.createElement("style");
		style.textContent = ":root{fill:" + widget.color + ";}";
		svg.insertBefore(style, svg.children[0]);
	}
};
