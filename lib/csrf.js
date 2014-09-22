'use strict';

var _ = require('lodash'),
    async = require('async'),
    mongoose = require('mongoose'),
    Osf = require('osf');

module.exports.Csrf = exports.Csrf = function (app) {
    var Csrf = this,
        ExpressCsrf = mongoose.model('ExpressCsrf');

    this.tokens = {};

    this.bind = function (route, postBinded) {
        if (typeof(this.tokens[route]) === "undefined") {
            this.tokens[route] = [];
        }
        this.tokens[route].push(postBinded);
    };

    this.token = function (callback) {
        return callback(null, Osf.String.id(26));
    };

    this.search = function (callback, results) {
        async.map(results.tokens, function (route, done) {
            ExpressCsrf.
                findOne({
                    sessionId: results.sid,
                    route: route
                }).
                exec(function (err, exist) {
                    if (err) {
                        return done(err);
                    }
                    return done(null, exist);
                });
        }, function (err, list) {
            if (err) {
                throw err;
            }

            var existed = {},
                idx;
            for (idx in list) {
                if (list[idx]) {
                    existed[list[idx].route] = list[idx];
                }
            }
            return callback(null, existed);
        });
    };

    this.update = function (callback, results) {
        async.map(results.tokens, function (route, done) {
            var csrf;
            if (typeof(results.existedCsrf[route]) === "undefined") {
                csrf = new ExpressCsrf({
                    sessionId: results.sid,
                    route: route,
                    value: results.token,
                    expire: new Date(Date.now() + (parseInt(300) * 1000))
                })
            } else {
                csrf = results.existedCsrf[route];
                csrf.value = results.token;
                csrf.expire = new Date(Date.now() + (parseInt(300) * 1000))
            }
            csrf.save(function (err, csrf) {
                if (err) {
                    return done(err);
                }
                return done(null, csrf);
            });
        }, function (err, updatedCsrf) {
            if (err) {
                throw err;
            }
            return callback(null, updatedCsrf);
        });
    };

    this.check = function (req, res, next) {
        var sid = req.sessionID,
            url = req.url;

        if ('GET' === req.method) {
            if (typeof(sid) === "undefined" || typeof(Csrf.tokens[url]) === "undefined") {
                return next();
            }

            async.auto({
                "sid": function (callback) {
                    return callback(null, sid);
                },
                "url": function (callback) {
                    return callback(null, url);
                },
                "tokens": [ "url", function (callback, results) {
                    return callback(null, Csrf.tokens[results.url]);
                }],
                "token": Csrf.token,
                "existedCsrf": [ "sid", "url", Csrf.search],
                "update": [ "token", "existedCsrf", Csrf.update]
            }, function (err, results) {
                if (err) {
                    return next(err);
                }
                res.setHeader('X-XSRF-TOKEN', results.token);
                return next();
            });
        } else if ('POST' === req.method) {
            if (typeof(Csrf.tokens[url]) === "undefined" || typeof(req.header('X-XSRF-TOKEN')) !== "string") {
                return next();
            }
            async.auto({
                "sid": function (callback) {
                    return callback(null, sid);
                },
                "url": function (callback) {
                    return callback(null, url);
                },
                "tokens": function (callback, results) {
                    return callback(null, [url]);
                },
                "token": Csrf.token,
                "existedCsrf": [ "sid", "url", function (callback, results) {
                    ExpressCsrf.
                        findOne({
                            sessionId: results.sid,
                            route: results.url
                        }).
                        exec(function (err, exist) {
                            if (err) {
                                return callback(err);
                            }
                            if (!exist) {
                                return callback("Error.Session.Hacked");
                            }

                            /*
                             var today = new Date();
                             var expire = new Date(req.session.rid[req.url].expire);
                             //-- Check expire date --//
                             if (expire < today) {
                             } else {
                             }
                             */

                            return callback(null, exist);
                        });
                }],
                "update": [ "token", "existedCsrf", Csrf.update]
            }, function (err, results) {
                if (err) {
                    if (err === "Error.Session.Hacked") {
                        return res.status(500).jsonp('Error.Session.Hacked');
                    }
                    return next(err);
                }
                return next();
            });
        } else {
            return next();
        }
    };

    app.settings.csrf = this;
    app.use(this.check);
};