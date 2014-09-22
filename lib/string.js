/**
 * Requirements
 */
var crypto = require('crypto');

module.exports.String = exports.String = new function () {
    this.id = function (length) {
        var text = "";
        var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
        for (var i = 0; i < length; i++)
            text += possible.charAt(Math.floor(Math.random() * possible.length));
        return text;
    };

    this.lowercase = function (str) {
        return (str + '').toLowerCase();
    };

    this.uppercase = function (str) {
        return (str + '').toUpperCase();
    };

    this.startsWith = function (str, search, position) {
        position = position || 0;
        return str.indexOf(search, position) === position;
    };

    this.endsWith = function (str, search, position) {
        position = position || str.length;
        position = position || search.length;
        var lastIndex = str.lastIndexOf(search);
        return lastIndex !== -1 && lastIndex === position;
    };

    this.ucfirst = function (str) {
        str += '';
        return str.charAt(0).toUpperCase() + str.substr(1).toLowerCase();
    };

    this.ucword = function (str) {
        return (str + '').replace(/^([a-z\u00E0-\u00FC])|\s+([a-z\u00E0-\u00FC])/g, function ($1) {
            return $1.toUpperCase();
        });
    };

    this.md5 = function (str, salt) {
        str += '';
        if (str.length === 0) {
            return str;
        }
        return crypto.createHmac('md5', salt).update(str).digest('hex');
    };

    this.sha1 = function (str, salt) {
        str += '';
        if (str.length === 0) {
            return str;
        }
        if(typeof(salt) === "undefined"){
            return crypto.createHash('sha1').update(str).digest('hex');
        }
        return crypto.createHmac('sha1', salt).update(str).digest('hex');
    };

    this.sha256 = function (str, salt) {
        str += '';
        if (str.length === 0) {
            return str;
        }
        if(typeof(salt) === "undefined"){
            return crypto.createHash('sha256').update(str).digest('hex');
        }
        return crypto.createHmac('sha256', salt).update(str).digest('hex');
    };

    this.sha512 = function (str, salt) {
        str += '';
        if (str.length === 0) {
            return str;
        }
        if(typeof(salt) === "undefined"){
            return crypto.createHash('sha512').update(str).digest('hex');
        }
        return crypto.createHmac('sha512', salt).update(str).digest('hex');
    };
};