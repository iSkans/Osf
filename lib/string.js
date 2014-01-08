/**
 * Requirements
 */
var crypto = require('crypto');

var $class = {};

$class.lowercase = function (str) {
    return (str + '').toLowerCase();
};

$class.uppercase = function (str) {
    return (str + '').toUpperCase();
};

$class.startsWith = function (str, search, position) {
    position = position || 0;
    return str.indexOf(search, position) === position;
};

$class.endsWith = function (str, search, position) {
    position = position || str.length;
    position = position || search.length;
    var lastIndex = str.lastIndexOf(search);
    return lastIndex !== -1 && lastIndex === position;
};

$class.ucfirst = function (str) {
    str += '';
    return str.charAt(0).toUpperCase() + str.substr(1).toLowerCase();
};

$class.ucword = function (str) {
    return (str + '').replace(/^([a-z\u00E0-\u00FC])|\s+([a-z\u00E0-\u00FC])/g, function ($1) {
        return $1.toUpperCase();
    });
};

$class.md5 = function (str, salt) {
    str += '';
    if (str.length === 0) {
        return str;
    }
    return crypto.createHmac('md5', salt).update(str).digest('hex');
};

$class.sha256 = function (str, salt) {
    str += '';
    if (str.length === 0) {
        return str;
    }
    return crypto.createHmac('sha256', salt).update(str).digest('hex');
};

$class.sha512 = function (str, salt) {
    str += '';
    if (str.length === 0) {
        return str;
    }
    return crypto.createHmac('sha256', salt).update(str).digest('hex');
};

//-- Export Class --//
if (typeof exports !== 'undefined') {
    if (typeof module !== 'undefined' && module.exports) {
        module.exports.string = $class;
    }
    exports.string = $class;
}