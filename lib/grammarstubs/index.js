"use strict";

var fs = require("fs");
var path = require("path");

var preStub = fs.readFileSync(path.join(__dirname + "/prestub.peg"), "utf8");
var postStub = fs.readFileSync(path.join(__dirname + "/poststub.peg"), "utf8");

module.exports = {
	preStub: preStub,
	postStub: postStub
};