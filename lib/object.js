/**
 * Requirements
 */
var $class = {};

$class.id = function (length) {
    var text = "";
    var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    for (var i = 0; i < length; i++)
        text += possible.charAt(Math.floor(Math.random() * possible.length));
    return text;
};
$class.size = function (obj) {
    var size = 0, key;
    for (key in obj) {
        if (obj.hasOwnProperty(key))
            size++;
    }
    return size;
};
$class.contains = function (obj, neddle) {
    var i;
    for (i in obj) {
        if (obj[i] === neddle) {
            return true;
        }
    }
    return false;
};

//-- Export Class --//
if (typeof exports !== 'undefined') {
    if (typeof module !== 'undefined' && module.exports) {
        module.exports.object = $class;
    }
    exports.object = $class;
}
