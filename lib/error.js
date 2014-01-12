var $class = {};

$class.msg = function (message, name) {
    var error = new Error(message);
    if(typeof(name) === "string"){
        error.name = name;
    }
    return error;
};

//-- Export Class --//
if (typeof exports !== 'undefined') {
    if (typeof module !== 'undefined' && module.exports) {
        module.exports.error = $class;
    }
    exports.error = $class;
}