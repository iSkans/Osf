'use strict';

var express = require('express');

var _ = require('lodash'),
    fs = require('fs'),
    path = require('path'),
    async = require('async'),
    logger = require('morgan'),
    winston = require('winston'),
    Osf = require('osf');

module.exports.App = exports.App = new function () {
    this.express = null;
    this.server = null;

    this.init = function () {
        this.express = express();
        this.server = require('http').createServer(this.express);
    }

    this.oauthServer = function () {
        this.express.use(Osf.OAuth.BearerToken);
    }

    this.configuration = function (config) {
        var compress = require('compression'),
            bodyParser = require('body-parser'),
            multipart = require('connect-multiparty'),
            expressValidator = require('express-validator'),
            methodOverride = require('method-override');

        _.merge(this.express, {
            settings: config
        });

        this.express.use(compress());
        this.express.set('views', path.join(this.express.get("path").public, 'views'));
        this.express.set('view engine', 'jade');
        this.express.set('etag', true);

        this.express.use(bodyParser.urlencoded({ extended: true }));
        this.express.use(bodyParser.json());
        this.express.use(multipart());

        this.express.use(expressValidator());
        this.express.use(function (req, res, next) {
            req.validate = function (mapped) {
                var errs = req.validationErrors();
                if (!errs) {
                    return null;
                }
                if (mapped) {
                    var errors = {};
                    errs.forEach(function (err, idx) {
                        errors[err.param] = err.msg;
                    });
                    return errors;
                }
                return errs;
            }
            next();
        });

        this.express.use(methodOverride());

    }

    this.models = function () {
        var folder = path.join(this.express.get("path").root, "models");
        if (fs.existsSync(folder)) {
            fs.readdirSync(folder).forEach(function (file) {
                if (file.substr(-3) === '.js') {
                    require(path.join(folder, file));
                    //In production disable autoindex from schema
                    // schema.set("autoindex",false);
                }
            });
        }
    }

    this.i18n = function () {
        var i18n = require("i18n");

        i18n.configure(_.assign(
            {
                "directory": path.join(this.express.get("path").public, "i18n")
            },
            this.express.get("i18n")
        ));
        this.express.use(i18n.init);
    }

    this.log = function () {
        var folder = path.join(this.express.get("path").root, this.express.get("log").directory);

        fs.mkdir(folder, "0755", function (err) {
            winston.add(winston.transports.File, { filename: path.join(folder, "123456.log") });
        });

        if (this.express.get('env') === 'development') {
            // Jade options: Don't minify html, debug intrumentation
            this.express.locals.pretty = true;
            this.express.locals.compileDebug = true;
            // Turn on console logging in development
            //app.use(logger('dev'));
            //format: ':remote-addr - - [:date] ":method :url HTTP/:http-version" :status :res[content-length] ":referrer" ":user-agent" [:response-time ms - :res[content-length] o]',

            this.express.use(logger('[:date] :remote-addr - :method :status :url :response-time ms :res[content-length]', {
                stream: {
                    write: function (message, encoding) {
                        winston.info(message);
                    }
                }
            }));
        }

        if (this.express.get('env') === 'production') {
            // Jade options: minify html, no debug intrumentation
            this.express.locals.pretty = false;
            this.express.locals.compileDebug = false;
            // Stream Express Logging to Winston
            this.express.use(logger({
                stream: {
                    write: function (message, encoding) {
                        winston.info(message);
                    }
                }
            }));
        }
    }

    this.mongoose = function () {
        var session = require('express-session'),
            mongoose = require('mongoose'),
            MongoStore = require('connect-mongo')(session),
            config = this.express.get("mongoose");

        mongoose.connect(config.url);

        _.merge(this.express.settings, {
            "session": {
                "store": new MongoStore({
                    "db": mongoose.connection.db,
                    "collection": config.collection,
                    "auto_reconnect": true
                })
            }
        });

        this.express.use(session(this.express.get("session")));
    }

    this.passport = function (passport) {
        new Osf.Passport(this.express);
    }

    this.csrf = function (csrf) {
        new Osf.Csrf(this.express);
    }

    this.oauthClient = function () {
        var app = this.express,
            options = app.get("oauth-client"),
            clients = {},
            config,
            name;

        for (name in options) {
            config = options[name];
            clients[name] = new Osf.OAuth.Client(config);
        }

        app.set("oauth-client", clients);
    }

    this.public = function () {
        var serveStatic = require("osf-static-file"),
            serveFavicon = require('serve-favicon');

        this.express.use(serveStatic(this.express.get("path").public, { maxAge: 86400000, "nocache": this.express.get("nocache")}));
        this.express.use(serveFavicon(path.join(this.express.get("path").public, this.express.get("favicon"))));
    }

    this.helmet = function () {
        var helmet = require('helmet');

        this.express.disable('x-powered-by');          // Don't advertise our server type
        this.express.use(helmet.nosniff());            // nosniff
        this.express.use(helmet.ienoopen());           // X-Download-Options for IE8+
        this.express.use(helmet.xssFilter());          // sets the X-XSS-Protection header
        this.express.use(helmet.hsts({maxAge: 300}));  // HTTP Strict Transport Security
        this.express.use(helmet.xframe('deny'));       // Prevent iframe
        this.express.use(helmet.crossdomain());        // crossdomain.xml
    }

    this.controller = function () {
        var app = this.express,
            folder = path.join(app.get("path").root, "controllers"),
            oauth;

        //-- Acl initialization --//
        var acl = new Osf.Acl(app.get("pkg").hostname, path.join(app.get("path").root, "config", "acl.json"));
        app.settings.acl = acl;

        if (app.get("oauth2").activated) {
            oauth = new Osf.OAuth.Server(app);
        }

        app.use(acl.check);

        if (fs.existsSync(folder)) {
            fs.readdirSync(folder).forEach(function (file) {
                if (file.substr(-3) === '.js') {
                    var route = require(path.join(folder, file));
                    new route.ctrl(app);
                }
            });
        }

        acl.update();

        if (oauth) {
            oauth.lockdown();
        }
    }

    this.error = function () {
        this.express.use(function (err, req, res, next) {
            err = Osf.Error(err);
            if (typeof(err.message) === "string" && ~err.message.indexOf('not found')) {
                err.status = 404;
            }

            var status,
                isAjax = req.xhr || req.header("content-type") === "application/x-www-form-urlencoded";

            if (typeof(err.status) !== "undefined") {
                switch (err.status.toString()) {
                    case "401":
                    case "404":
                        //Not log them
                        break;
                    case "500":
                        winston.warn(err);
                        winston.warn(err.status.toString(), "-", err.name, "-", err.message);
                        winston.warn(err.stack + "\n");
                        break;
                }
            } else {
                err.status = 500;
                winston.error(err.stack + "\n");
            }
            if (!res._header) {
                res.status(err.status);

                if (isAjax) {
                    var data;
                    if (typeof(err.object) !== "undefined") {
                        data = err.object;
                    } else if (typeof(err.message) === "string") {
                        data = {
                            "name": err.name,
                            "message": err.message
                        };
                    } else if (typeof(err.message) !== "undefined") {
                        data = err.message;
                    } else {
                        data = err;
                    }
                    return res.jsonp(data);
                } else {
                    return res.render('layout/error', {
                        title: res.__(err.name),
                        error: res.__(err.message)
                    });
                }
            }
        });
    }

    this.run = function () {
        var mongoose = require('mongoose'),
            app = this.express,
            server = this.server;

        mongoose.connection.on('error', function () {
            winston.error('Mongodb connection error!');
            if (process) {
                process.exit(0);
            }
        });

        mongoose.connection.on('open', function () {
            winston.info('Mongodb connected!');

            // "server.listen" for socket.io
            server.listen(app.get("pkg").config.port, function () {
                winston.info(app.get("pkg").name, 'listening on port', app.get("pkg").config.port, 'in', app.get("env"), 'mode.');

                // Exit cleanly on Ctrl+C
                if (process) {
                    process.on('SIGINT', function () {
                        winston.info(app.get("pkg").name + 'has shutdown');
                        winston.info(app.get("pkg").name + 'was running for', Math.round(process.uptime()), 'seconds.');
                        process.exit(0);
                    });
                }
            });
        });
    }
};