var $class = {};

$class.msg = function (message, name, obj) {
    if(message instanceof  Error){
        return message;
    }
    var error = new Error();
    error.message = message;
    if(typeof(name) === "string"){
        error.name = name;
    }
    if(typeof(obj) !== "undefined"){
        error.object = obj;
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