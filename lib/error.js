module.exports.Error = exports.Error = function () {
    var error = new Error();
    error.name = "Unknown_Error";
    error.message = "Error";
    error.status = 500;
    if (0 < arguments.length) {
        for (var idx = 0; idx < arguments.length; idx++) {
            if (idx === 0) {
                if (arguments[idx] instanceof  Error) {
                    error = arguments[idx];
                    if (error.status === undefined) {
                        error.status = 500;
                    }
                    break;
                }
                if (typeof(arguments[idx]) === "string") {
                    error.name = arguments[idx];
                    continue;
                } else {
                    if(arguments[idx]){
                        error.object = arguments[idx];
                    }
                    break;
                }
            }
            if (idx === 1) {
                error.message = arguments[idx];
                continue;
            }
            if (idx === 2) {
                if(arguments[idx]){
                    error.object = arguments[idx];
                }
                continue;
            }
            if (idx === 3) {
                error.status = arguments[idx];
                continue;
            }
        }
    }
    return error;
};
