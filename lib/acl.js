/**
 * Requirements
 */
//var crypto = require('crypto');

var $class = {};

$class.init = function(config){
    //console.log("NAME: "+config.name);
};


$class.checker = function(config){
    return function(req, res, next){
        console.log(req.url);
        next();
    };
};


//-- Export Class --//
if (typeof exports !== 'undefined') {
    if (typeof module !== 'undefined' && module.exports) {
        module.exports.acl = $class;
    }
    exports.acl = $class;
}