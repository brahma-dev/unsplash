/*jshint node: true*/
'use strict';

var fs = require('fs');
var path = require('path');
var commander = require('commander');
module.exports = {
    process: function (args) {
        commander.usage("[options] <folder ...>").option('-f, --featured', "download only featured images").parse(args);
        var onlyfeatured = commander.featured || false;
        var downloadPath = process.cwd();
        if (commander.args && commander.args[0]) {
            downloadPath = path.join(downloadPath, commander.args[0]);
            if (!fs.existsSync(downloadPath)) {
                console.log('The path "' + downloadPath + '" does not exist.');
                process.exit(1);
            }
        }
        require(path.join(__dirname, "/index.js"))(downloadPath, onlyfeatured);
    }
};
