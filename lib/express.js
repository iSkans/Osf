/**
 * Requirements
 */
var express = require('express'),
    connect = require('connect'),
    views = require('view-helpers'),
    i18n = require("i18n"),
    mongoStore = require('connect-mongo')(express),
    _ = require('underscore'),
    Osf = {};
_.extend(Osf, require(__dirname + '/object'), require(__dirname + '/acl'));

var $class = {};

$class.init = function (config, routes, passport) {
    var app = express();

    //-- Enable Stack Error --//
    app.set('showStackError', true);

    //-- Conpress File --//
    app.use(express.compress({
        filter: function (req, res) {
            return (/json|text|javascript|css/).test(res.getHeader('Content-Type'));
        },
        level: 9
    }));

    //-- Cross domain --//
    if (config.crossdomain) {
        app.use(function (req, res, next) {
            if (config.crossdomain.indexOf(req.headers.origin) !== -1) {
                if (typeof(req.headers.origin) !== 'undefined') {
                    res.header("Access-Control-Allow-Origin", req.headers.origin);
                    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, X-Prototype-Version, X-Rid, Allow, Authorization, Content-Type, Accept, Cookie");
                    res.header('Access-Control-Allow-Methods', 'PUT, GET, POST, DELETE, OPTIONS');
                    res.header("Access-Control-Allow-Credentials", "true");
                }
            }
            next();
        });
    }

    //-- Authentication --//
    if (config.authentication) {
        app.use(express.basicAuth(function (user, pswd) {
            return typeof(config.authentication[user]) !== "undefined" && config.authentication[user] === pswd;
        }));
    }

    //-- Static folder --//
    app.use(express.favicon());
    app.use(express.static(config.publicPath));

    //-- Disable logger for test --//
    if (process.env.NODE_ENV !== 'test') {
        app.use(express.logger('dev'));
    }

    //-- Enable i18n --//
    i18n.configure({
        locales: ['en', 'fr'],
        defaultLocale: 'fr',
        directory: config.publicPath + '/i18n'
    });
    app.use(i18n.init);

    //-- Configure view renderer --//
    app.set('views', config.rootPath + '/views');
    app.set('view engine', 'jade');

    //-- Enable jsonp --//
    app.enable("jsonp callback");

    app.configure(function () {
        //-- Initialize Cookie Parser --//
        app.use(express.cookieParser());

        //-- Initialize Body Parser --//
        app.use(connect.urlencoded());
        app.use(connect.json());
        app.use(express.methodOverride());

        //-- Initialize Mongo Session --//
        app.use(express.session({
            secret: config.sessionKey,
            key: "sid",
            cookie: {
                path: config.cookie.path,
                domain: config.cookie.domain,
                maxAge: config.cookie.maxAge
            },
            store: new mongoStore(config.db)
        }));

        app.use(views(config.app.name));

        //-- Initialize Passports --//
        if (typeof(passport) !== 'undefined') {
            app.use(passport.initialize());
            app.use(passport.session());
            //app.use(passport.authenticate('remember-me'));
        }
        app.use(Osf.acl.checker(config));

        //-- Check Request Id --//
        app.use($class.rid(config));

        //-- Routes --//
        app.use(app.router);

        //-- Errors handler --//
        //Assume "not found" in the error msgs is a 404. this is somewhat silly, but valid, you can do whatever you like, set properties, use instanceof etc.
        app.use(function (err, req, res, next) {
            //Treat as 404
            if (~err.message.indexOf('not found')) return next();

            //Log it
            console.error(err.stack);

            //Error page
            res.status(500).render('error/500', {
                config: config,
                error: err.stack
            });
        });

        //Assume 404 since no middleware responded
        app.use(function (req, res, next) {
            res.status(404).render('error/404', {
                config: config,
                url: req.originalUrl,
                error: 'Not found'
            });
        });
    });

    require(routes)(config, app, passport);

    Osf.acl.init(config, app.routes);
    return app;
};

$class.rid = function (config) {
    return function (req, res, next) {
        function create(expire) {
            if (typeof(config.rid) !== "undefined" && typeof(config.rid[req.url]) !== "undefined") {
                var rid = Osf.object.id(26);
                res.setHeader('X-Rid', rid);
                res.setHeader("Access-Control-Expose-Headers", "X-Rid");
                if (typeof(req.session.rid) === "undefined") {
                    req.session.rid = {};
                }
                req.session.rid[req.url] = {
                    value: rid,
                    expire: new Date(Date.now() + (parseInt(config.rid[req.url]) * 1000))
                };
            }
        }

        if ('GET' === req.method) {
            create();
        } else if ('POST' === req.method) {
            //-- Rid Mandatory --//
            if (typeof(config.rid) !== "undefined" && typeof(config.rid[req.url]) !== "undefined") {
                //-- Rid does not exist --//
                if (typeof(req.session.rid) === "undefined" || typeof(req.session.rid[req.url]) === "undefined") {
                    return res.status(500).jsonp('Error.Session.Hacked');
                }
                var today = new Date();
                var expire = new Date(req.session.rid[req.url].expire);
                //-- Check expire date --//
                if (expire < today) {
                    return res.status(500).jsonp('Error.Session.Expired');
                } else {
                    create();
                }
            }
        }
        next();
    };
};

//-- Export Class --//
if (typeof exports !== 'undefined') {
    if (typeof module !== 'undefined' && module.exports) {
        module.exports.express = $class;
    }
    exports.express = $class;
}