//     Osf.js 3.0.0
//     (c) 2013 Melo, melo@iskans.com
//     Osf may be freely distributed under the MIT license.

var _ = require('lodash'),
    fs = require('fs'),
    path = require('path');

module.exports.OAuth = exports.OAuth = {
    VERSION: '3.0.2'
};

//-- Load Osf libraries --//
fs.readdirSync(path.join(__dirname, 'oauth')).forEach(function (file) {
    if (file.substr(-3) === '.js') {
        _.assign(exports.OAuth, require(path.join(__dirname, 'oauth', file)));
    }
});