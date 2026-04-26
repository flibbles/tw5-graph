/*\

Defines images types, and manages fetching a url from titles.

\*/

"use strict";

var Color = require("./color.js");

exports.name = "image";

exports.type = "title";

exports.toProperty = function(info, value, options) {
	var parentWidget = options.widget;
	var wiki = parentWidget.wiki;
	var widget = parentWidget.imageWidget;
	if (!wiki.tiddlerExists(value) && !wiki.isShadowTiddler(value)) {
		// It's a tiddler. It must be a literal link to an external source.
		return value;
	}
	if (!widget) {
		var parser = wiki.getCacheForTiddler(value, "graphImageParser", function() {
			return getImageParser(value, wiki);
		});
		widget = wiki.makeWidget(parser, {parentWidget: parentWidget});
		widget.typeInfo = parser.typeInfo;
		parentWidget.imageWidget = widget;
	}
	if (!widget.uri) {
		var widget = parentWidget.imageWidget;
		var container = $tw.fakeDocument.createElement("div");
		var typeInfo = widget.typeInfo;
		var url, svg;
		widget.render(container, null);
		if (!widget.typeInfo) {
			// Probably just a literal link to an external image
			url = container.innerHTML;
		} else if (typeInfo.encoding === "base64") {
			// .pdf .png .jpg etc.
			url = "data:" + (typeInfo.deserializerType || "utf8") + ";base64," + container.innerHTML;
		} else if (svg = findSVGElement(container)) {
			// wikitext-based SVG?
			//data = "data:" + deserializerType + ";" + encoding + "," + encodeURIComponent(text);
			injectNamespace(svg);
			var style = getStyle(info, parentWidget);
			injectStyle(svg, style);
			var encoding = "";
			if(wiki.isImageTiddler(value)) {
				encoding = ";utf8";
			}
			url = "data:image/svg+xml" + encoding + "," + encodeURIComponent(container.innerHTML);
		} else {
			url = null;
		}
		widget.url = url;
	}
	return parentWidget.imageWidget.url;
};

exports.refresh = function(info, value, changedTiddlers, widget) {
	if (changedTiddlers[value]) {
		widget.imageWidget = undefined;
		return true;
	}
	if (!widget.imageWidget) {
		return true;
	}
	if (widget.imageWidget.refresh(changedTiddlers)) {
		widget.imageWidget.uri = undefined;
		return true;
	}
	// Now we need to check whether any property-dependent styles for the
	// image have changed.
	return refreshStyle(info, widget, changedTiddlers);
};

function getImageParser(title, wiki) {
	var parser;
	var typeInfo;
	// Check if it is an image tiddler
	if(wiki.isImageTiddler(title)) {
		var tiddler = wiki.getTiddler(title),
			type = tiddler.fields.type,
			text = tiddler.fields.text,
			data;
		typeInfo = $tw.config.contentTypeInfo[type] || {};
		if(text) {
			var encoding = typeInfo.encoding || "utf8";
			if (encoding === "base64") {
				parser = { tree: [{
					type: "text",
					attributes: { text: {type: "string", value: text} }
				}]};
			} else {
				// It's an xml svg probably. We still need to parse it into
				// a DOM tree for manipulation.
				text = text.replace(/^<\?[^?]*\?>/, "");
				// Also remove DOCTYPE declarations
				text = text.replace(/^\s*<!DOCTYPE\s[^>]*>/, "");
				parser = wiki.parseText("text/vnd.tiddlywiki", "\\rules only html commentinline commentblock\n" + text, {parseAsInline: true});
			}
			//deserializerType = typeInfo.deserializerType || type;
			// Render the appropriate element for the image type by
			// looking up the encoding in the content type info
		} else if(tiddler.fields._canonical_uri) {
			parser = {
				tree: [{
					type: "text",
					attributes: { text: {type: "string", value: tiddler.fields._canonical_uri} }
			}]};
			// It's a link. We don't need to describe type info
			typeInfo = null;
		} else {
			// This must be a lazily loaded tiddler. We don't support those yet.
			text = null;
		}
	} else if (wiki.tiddlerExists(title) || wiki.isShadowTiddler(title)) {
		// We assume it is wikitext trying to make an svg
		parser = wiki.parseTiddler(title, {parseAsInline: true});
		typeInfo = $tw.config.contentTypeInfo["image/svg+xml"];
	} else {
		parser = { tree: [{
			type: "text",
			attributes: { text: {type: "string", value: title} }
		}]};
	}
	parser.typeInfo = typeInfo;
	return parser;
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

function getStyle(info, objectWidget) {
	if (!info.style) {
		return "";
	}
	var styleParts = [];
	for (var attribute in info.style) {
		var key = info.style[attribute];
		var styleValue = objectWidget.evaluateProperty(key);
		// probably "fill:color", but any kind of css styling is allowed.
		styleParts.push(attribute + ":" + styleValue + ";");
	}
	return ":root{" + styleParts.join("") + "}";
};

function refreshStyle(info, objectWidget, changedTiddlers) {
	for (var attribute in info.style) {
		var key = info.style[attribute];
		if (objectWidget.refreshProperty(key, changedTiddlers)) {
			return true;
		}
	}
	return false;
};

function injectNamespace(svg) {
	// wikitext svg does not need namespacing, but data URIs do
	svg.setAttribute("xmlns", "http://www.w3.org/2000/svg");
};

function injectStyle(svg, style) {
	if (style) {
		var styleElement = $tw.fakeDocument.createElement("style");
		styleElement.textContent = style;
		svg.insertBefore(styleElement, svg.children[0]);
	}
};
