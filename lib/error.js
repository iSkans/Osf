var $class = {};

$class.msg = function (message, name, acl) {
    var error = new Error();
    error.message = message;
    if(typeof(name) === "string"){
        error.name = name;
    }
    if(typeof(name) !== "undefined"){
        error.acl = acl;
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