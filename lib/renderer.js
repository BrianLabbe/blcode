"use strict";

var Promise = require("bluebird");

var TagTypes = {
	OpenTag : "openTag",
	CloseTag : "closeTag"
};

function Renderer(PEGparser, tagNames, tagDetails) {
	this.parser = PEGparser;
	this.tags = tagNames;
	this.details = tagDetails;
}

Renderer.prototype = {
	render : function(contentInput) {
		var parser = this.parser;
		var details = this.details;
		var tagNames = this.tags;

		return new Promise( function(resolve, reject) {

			var contentParsed;
			
			// If parsing fails, reject the promise with the error and let the caller decide how to deal with it
			try {
				contentParsed = parser.parse(contentInput);
			} catch (error) {
				reject(error);
			}
			
			// Render the parsed content to HTML
			var contentRendered = "";

			contentParsed.forEach( function(element) {
				var currentTagDetails = details[tagNames[element.name]];

				if (typeof element.type === "undefined") { // element is a plain string
					contentRendered += element;
				} else if (element.type == TagTypes.OpenTag) { // element is open tag
					var prestub = currentTagDetails.open;

					if (currentTagDetails.type == "LeafOpenClose") {
						prestub = prestub.replace("#val#", element.value);
					}

					element.attributes.forEach( function(attribute) {
						if(currentTagDetails.attr[attribute.name] !== null) {
							var attributestring = currentTagDetails.attr[attribute.name].replace("#val#", attribute.value);

							var attrkey = "#" + attribute.name + "#";
							prestub = prestub.replace(attrkey, attributestring);
						}
					});

					contentRendered += prestub;
				} else { // element is close tag
					var poststub = currentTagDetails.close;

					contentRendered += poststub;
				}
			}, this);

			resolve(contentRendered);
		});
		
	}
};

module.exports = Renderer;