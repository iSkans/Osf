//     Osf.js 3.0.0
//     (c) 2013 Melo, melo@iskans.com
//     Osf may be freely distributed under the MIT license.

//-- Load all class --//
var fs = require('fs'),
    _ = require('underscore'),
    Osf = {
        VERSION: '3.0.0'
    };

fs.readdirSync(__dirname+'/lib').forEach(function (file) {
    _.extend(Osf, require(__dirname+'/lib/' + file));
});

//-- Export Osf --//
if (typeof exports !== 'undefined') {
    if (typeof module !== 'undefined' && module.exports) {
        module.exports = Osf;
    }
    exports = Osf;
}
