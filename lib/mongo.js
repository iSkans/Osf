/**
 * Requirements
 */
var fs = require('fs'),
    mongoose = require('mongoose');

var $class = {};

$class.init = function (config) {
    //-- Connect to database --//
    mongoose.connect(config.db.url);

    //-- Load entities --//
    if (fs.existsSync(config.rootPath + '/models')) {
        fs.readdirSync(config.rootPath + '/models').forEach(function (file) {
            require(config.rootPath + '/models/' + file);
        });
    }
};

$class.error = {
    listener: function (res, data) {
        var response, name;
        if(!data){
            response = data
        } else if(typeof(data.name) !== "string"){
            response = data
        } else if (data.name === 'ValidationError') {
            response = {};
            for (name in data.errors) {
                response[name] = data.errors[name].type;
            }
        } else {
            response = data;
        }
        return res.status(500).jsonp(response);
    }
};

//-- Export Class --//
if (typeof exports !== 'undefined') {
    if (typeof module !== 'undefined' && module.exports) {
        module.exports.mongo = $class;
    }
    exports.mongo = $class;
}