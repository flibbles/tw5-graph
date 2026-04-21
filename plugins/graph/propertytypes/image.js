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
			if (info.color) {
				widget.color = Color.toProperty(null, info.color, {widget: widget});
				injectStyle(svg, widget);
			}
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
	// Now we need to check whether the color for this image has changed
	if (Color.refresh(null, info.color || "", changedTiddlers, widget.imageWidget)) {
		return true;
	}
	return false;
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
				parser = wiki.parseText("text/vnd.tiddlywiki", "\\rules only html\n" + text, {parseAsInline: true});
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
