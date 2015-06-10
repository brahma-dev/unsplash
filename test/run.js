/*jshint node: true*/
var path = require('path');
var unsplash = require(path.join(__dirname, "/../lib/"));
unsplash(path.join(__dirname, "/wallpapers"), true);
