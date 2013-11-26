var $class = {};

$class.contains = function (array, neddle) {
    var i = array.length;
    while (i--) {
        if (array[i] === neddle) {
            return true;
        }
    }
    return false;
};

//-- Export Class --//
if (typeof exports !== 'undefined') {
    if (typeof module !== 'undefined' && module.exports) {
        module.exports.array = $class;
    }
    exports.array = $class;
}