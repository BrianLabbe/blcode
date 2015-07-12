"use strict";

var PEGJS = require("pegjs");
var fs = require("fs");
var path = require("path");

var grammarStubs = require("./grammarstubs");
var Renderer = require("./renderer");

function Generator() {
	this.preStub = grammarStubs.preStub;
	this.postStub = grammarStubs.postStub;
};

Generator.prototype = {
	makeRenderer: function(pathToDescription) {

		if (typeof pathToDescription !== "string") {
			throw new Error("pathToDescription should be a string containing a path to a file");
		}

		var description = fs.readFileSync(pathToDescription, "utf8");
		var descriptionJSON = JSON.parse(description);

		if (typeof descriptionJSON.tags === "undefined") {
			throw new Error("The description file has no tags");
		}

		var tags = descriptionJSON.tags;

		var tagsDetails = []; // The tag details (tag type, info on how to render attributes, and info on how to render open and close tags)
		var tagsNames = {}; // The tag names that map to the tag details

		// The names that need PEG.js rules generated

		var openCloseTagRuleNames = [];
		var standaloneTagRuleNames = [];
		var leafOpenCloseTagRuleNames = [];

		var currentTagDetailsIndex = 0;

		tags.forEach( function(tag) {

			// Map the tag name and any alternate names for the tag to the details

			var details = {
				type: tag.type,
				attributes: tag.attr,
				open: tag.open,
				close: tag.close
			};

			tagsDetails[currentTagDetailsIndex] = details;

			tagsNames[tag.name] = currentTagDetailsIndex;

			if(typeof tag.alt !== "undefined") {
				tag.alt.forEach( function(alternateName) {
					tagsNames[alternateName] = currentTagDetailsIndex;

					// Add the alternate tag names to list of names that need rules
					switch(tag.type) {
						case "OpenClose":
							openCloseTagRuleNames.push(alternateName);
							break;
						case "Standalone":
							standaloneTagRuleNames.push(alternateName);
							break;
						case "LeafOpenClose":
							leafOpenCloseTagRuleNames.push(tag.name);
							break;
					}
				});
			}

			currentTagDetailsIndex = currentTagDetailsIndex + 1;

			// Add the name to list of names that need rules

			switch(tag.type) {
				case "OpenClose":
					openCloseTagRuleNames.push(tag.name);
					break;
				case "Standalone":
					standaloneTagRuleNames.push(tag.name);
					break;
				case "LeafOpenClose":
					leafOpenCloseTagRuleNames.push(tag.name);
					break;
			}
		});

		var rulesStrings = this.generateRulesStrings(openCloseTagRuleNames, standaloneTagRuleNames, leafOpenCloseTagRuleNames);

		// Make parser and renderer

		var grammar   = this.preStub + 
						rulesStrings.openCloseTagsRulesString + 
						rulesStrings.standaloneTagsRulesString + 
						rulesStrings.leafOpenCloseTagsRulesString + 
						this.postStub;

		var parser = PEGJS.buildParser(grammar);

		var renderer = new Renderer(parser, tagsNames, tagsDetails);

		return renderer;
	},

	generateRulesStrings: function(openCloseTagRuleNames, standaloneTagRuleNames, leafOpenCloseTagRuleNames) {
		var openCloseTagsGrammar = "OpenCloseTagName \n";

		openCloseTagRuleNames.forEach( function(tagRuleName, index) {
			if (index !== 0) {
				openCloseTagsGrammar += " / \"" + tagRuleName + "\"\n";
			} else {
				openCloseTagsGrammar += " = \"" + tagRuleName + "\"\n";
			}
		});

		var standaloneTagsGrammar = "StandaloneTagName \n";

		standaloneTagRuleNames.forEach( function(tagRuleName, index) {
			if (index !== 0) {
				standaloneTagsGrammar += " / \"" + tagRuleName + "\"\n";
			} else {
				standaloneTagsGrammar += " = \"" + tagRuleName + "\"\n";
			}
		});

		var leafOpenCloseTagsGrammar = "LeafOpenCloseTagName \n";

		leafOpenCloseTagRuleNames.forEach( function(tagRuleName, index) {
			if (index !== 0) {
				leafOpenCloseTagsGrammar += " / \"" + tagRuleName + "\"\n";
			} else {
				leafOpenCloseTagsGrammar += " = \"" + tagRuleName + "\"\n";
			}
		});

		return {
			openCloseTagsRulesString: openCloseTagsGrammar,
			standaloneTagsRulesString: standaloneTagsGrammar,
			leafOpenCloseTagsRulesString: leafOpenCloseTagsGrammar
		}
	}
}

module.exports = new Generator();