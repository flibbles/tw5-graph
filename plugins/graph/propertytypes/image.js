/*\

Defines images types, and manages fetching a url from titles.

\*/

"use strict";

exports.name = "image";

exports.type = "title";

exports.toProperty = function(info, value, options) {
	var src;
	var tiddler = options.wiki.getTiddler(value);
	if (!tiddler) {
		// It does not appear to be a real tiddler,
		// so let's treat it like a real URL.
		src = value;
	} else {
		// Check if it is an image tiddler
		if(options.wiki.isImageTiddler(value)) {
			var type = tiddler.fields.type,
				text = tiddler.fields.text,
				_canonical_uri = tiddler.fields._canonical_uri,
				typeInfo = $tw.config.contentTypeInfo[type] || {},
				deserializerType = typeInfo.deserializerType || type;
			// If the tiddler has body text then it doesn't need to be lazily loaded
			if(text) {
				// Render the appropriate element for the image type by looking up the encoding in the content type info
				var encoding = typeInfo.encoding || "utf8";
				if (encoding === "base64") {
					// .pdf .png .jpg etc.
					src = "data:" + deserializerType + ";base64," + text;
					/*
					if (deserializerType === "application/pdf") {
						tag = "embed";
					}
					*/
				} else {
					// .svg .tid .xml etc.
					src = "data:" + deserializerType + ";" + encoding + "," + encodeURIComponent(text);
				}
			} else if(_canonical_uri) {
				switch(deserializerType) {
					case "application/pdf":
						//tag = "embed";
						src = _canonical_uri;
						break;
					default:
						src = _canonical_uri;
						break;
				}
			} else {
				// Just trigger loading of the tiddler
				// No idea if I should support this or not
				//this.wiki.getTiddlerText(this.imageSource);
			}
		} else {
			// We assume it is wikitext trying to make an svg
			var body = options.wiki.renderTiddler("text/html", value, {parseAsInline: true});
			if (body.indexOf("xmlns=") < 0) {
				// wikitext svg does not need namespacing, but data URIs do
				body = body.replace("<svg", '<svg xmlns="http://www.w3.org/2000/svg"');
			}
			src = "data:image/svg+xml," + encodeURIComponent(body);
		}
	}
	return src;
};
