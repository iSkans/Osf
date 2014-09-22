var parseurl = require('parseurl');
var resolve = require('path').resolve;
var send = require('send');
var url = require('url');

/**
 * Escape the given string of `html`.
 *
 * @param {String} html
 * @return {String}
 * @api private
 */

function escape(html) {
    return String(html)
        .replace(/&(?!\w+;)/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
};

/**
 * Shallow clone a single object.
 *
 * @param {Object} obj
 * @param {Object} source
 * @return {Object}
 * @api private
 */

function extend(obj, source) {
    if (!source) return obj;

    for (var prop in source) {
        obj[prop] = source[prop];
    }

    return obj;
};

module.exports.StaticFile = exports.StaticFile = function (root, options) {
    this.mime = send.mime;

    options = extend({}, options);

    // root required
    if (!root) throw new TypeError('root path required');

    // resolve root to absolute
    root = resolve(root);

    // default redirect
    var redirect = false !== options.redirect;

    // setup options for send
    var nocache = [], idx = 0;
    if(typeof(options.nocache) === "object"){
        for(idx; idx < options.nocache.length; idx++){
            nocache.push(new RegExp(options.nocache[idx]));
        }
        delete options.nocache;
    }

    options.maxage = options.maxage || options.maxAge || 0;
    options.root = root;

    return function staticMiddleware(req, res, next) {
        if ('GET' != req.method && 'HEAD' != req.method) return next();
        var opts = extend({}, options);
        var originalUrl = url.parse(req.originalUrl || req.url);
        var path = parseurl(req).pathname;

        if (path == '/' && originalUrl.pathname[originalUrl.pathname.length - 1] != '/') {
            return directory();
        }

        function directory() {
            if (!redirect) return next();
            var target;
            originalUrl.pathname += '/';
            target = url.format(originalUrl);
            res.statusCode = 303;
            res.setHeader('Location', target);
            res.end('Redirecting to ' + escape(target));
        }

        function error(err) {
            if (404 == err.status) return next();
            next(err);
        }

        var idx = 0;
        for(idx; idx < nocache.length; idx++){
            if(nocache[idx].test(path)){
                opts.maxage = 0;
                break;
            }
        }

        send(req, path, opts)
            .on('error', error)
            .on('directory', directory)
            .pipe(res);
    };
};

/**
 * Expose mime module.
 *
 * If you wish to extend the mime table use this
 * reference to the "mime" module in the npm registry.
 */

exports.StaticFile.mime = send.mime;
exports.mime = send.mime;
