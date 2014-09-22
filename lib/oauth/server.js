'use strict';

var _ = require('lodash'),
    async = require("async"),
    mongoose = require('mongoose'),
    OAuth2Server = require('oauth2-server'),
    Osf = require("osf");

module.exports.Server = exports.Server = function (app) {
    var Server = this;
    var ctrl = new Osf.Controller("OAuth", app),
        Account = mongoose.model('OAuthAccount'),
        Person = mongoose.model('OAuthUser'),
        OAuthClient = mongoose.model('OAuthClient'),
        Client = mongoose.model('OAuthClient'),
        AllowedClient = mongoose.model('OAuthAllowedClient'),
        OAuthAccessToken = mongoose.model('OAuthAccessToken'),
        OAuthRefreshToken = mongoose.model('OAuthRefreshToken'),
        AuthCode = mongoose.model('OAuthAuthCode'),
        pkg = app.get("pkg"),
        crypto = app.get("crypto"),
        config = app.get("oauth2"),
        model = {
            "getAccessToken": function (token, callback) {
                OAuthAccessToken.
                    findOne({ value: token }).
                    populate({path: "user", select: "-roles -accounts -disabled"}).
                    exec(callback);
            },
            "saveAccessToken": function (token, clientId, expires, user, callback) {
                //console.log('in saveAccessToken (token: ' + token + ', clientId: ' + clientId + ', userId: ' + userId + ', expires: ' + expires + ')');
                var accessToken = new OAuthAccessToken({
                    user: user,
                    clientId: clientId,
                    value: token,
                    expires: expires
                });
                accessToken.save(callback);
            },
            "getRefreshToken": function (token, callback) {
                OAuthRefreshToken.
                    findOne({ value: token }).
                    populate({path: "user", select: "-roles -accounts -disabled"}).
                    exec(callback);
            },
            "saveRefreshToken": function (token, clientId, expires, user, callback) {
                var refreshToken = new OAuthRefreshToken({
                    user: user,
                    clientId: clientId,
                    value: token,
                    expires: expires
                });

                refreshToken.save(callback);
            },
            "getClient": function (clientId, clientSecret, callback) {
                //console.log('in getClient (clientId: ' + clientId + ', clientSecret: ' + clientSecret + ')');
                if (clientSecret) {
                    OAuthClient.findOne({ clientId: clientId, clientSecret: clientSecret }, callback);
                } else {
                    OAuthClient.findOne({ clientId: clientId }, callback);
                }
            },
            "grantTypeAllowed": function (clientId, grantType, callback) {
                /*
                 var authorizedClientIds = ['s6BhdRkqt3', 'toto'];
                 console.log('in grantTypeAllowed (clientId: ' + clientId + ', grantType: ' + grantType + ')');
                 if (grantType === 'password') {
                 return callback(null, authorizedClientIds.indexOf(clientId) >= 0);
                 }
                 */
                callback(null, true);
            },
            "getUser": function (username, password, callback) {
                Account.findOne({email: Osf.String.lowercase(username)}, function (err, account) {
                    if (err) {
                        return callback(err);
                    }
                    if (!account) {
                        return callback(Osf.Error("OAuth_Server_Error", username + " does not exist.", {email: "notexists"}));
                    }

                    var sha1 = Osf.String.sha1(password);
                    var sha512 = Osf.String.sha512(password, app.get("crypto").salt);

                    Person.
                        findOne({
                            $or: [
                                {
                                    password: sha512,
                                    disabled: 0,
                                    accounts: account
                                },
                                {
                                    password: sha1,
                                    disabled: 0,
                                    accounts: account
                                }
                            ]
                        },
                        function (err, person) {
                            if (err) {
                                return callback(err);
                            }
                            if (!person) {
                                return callback(Osf.Error("OAuth_Server_Error", "Invalid password for " + username + ".", {password: "invalid"}));
                            }

                            return callback(null, person);
                        });
                })

                //console.log('getUser (username: ' + username + ', password: ' + password + ')');
                //Person.findOne({ username: username, password: password }, callback);
            },
            "getUserFromClient": function (clientId, clientSecret, callback) {
                //console.log('getUserFromClient (clientId: ' + clientId + ', clientSecret: ' + clientSecret + ')');
                OAuthClient.
                    findOne({ clientId: clientId, clientSecret: clientSecret }).
                    populate({path: "owner", select: "-roles -accounts -disabled"}).
                    exec(function (err, client) {
                        callback(err, client ? client.owner : null);
                    });
            },
            "getAuthCode": function (authCode, callback) {
                AuthCode.
                    findOne({ value: authCode }).
                    populate({path: "user", select: "-roles -accounts -disabled"}).
                    exec(callback);
            },
            "saveAuthCode": function (authCode, clientId, expires, user, callback) {
                var authcode = new AuthCode({
                    "user": user,
                    "clientId": clientId,
                    "value": authCode,
                    "expires": expires
                });
                authcode.save(function (err) {
                    if (err) {
                        return callback(err);
                    }
                    return callback(null, authcode);
                })
            },
            "checkUserApproved": function (req, callback) {
                if (typeof(req.user) === "undefined") {
                    return  callback(Osf.Error("OAuth_Server_Error", "User not connected", "500"));
                }
                return callback(null, true, req.user);
            }
        };

    app.oauth = new OAuth2Server({
        model: model,
        grants: config.grants,
        debug: config.debug
    });

    //-- Update default client --//
    if (config.client) {
        app.on('osf.passport.user.loaded', function(){
            async.auto({
                //-- Validation --//
                "client": function (callback) {
                    OAuthClient.findOne({
                        clientId: config.client.clientId,
                        clientSecret: config.client.clientSecret
                    }, callback);
                },

                //-- Admin --//
                "admin": function (callback) {
                    Person.findOne({
                        username: Osf.String.ucfirst(pkg.author.name),
                        provider: pkg.domain
                    }, callback);
                },

                //-- Get profile --//
                "update": ["client", "admin", function (callback, results) {
                    if (!results.admin) {
                        return  callback(Osf.Error("OAuth_Server_Error", "Admin user does not found."));
                    }
                    if (results.client) {
                        results.client.owner = results.admin;
                        results.client.set(config.client).save(callback);
                    } else {
                        var client = new OAuthClient(config.client);
                        client.owner = results.admin;
                        client.save(callback);
                    }
                }]
            }, function (err, results) {
                if (err) {
                    throw err;
                }
            });
        });
    }


    if (typeof(config.token) !== "undefined") {
        ctrl.post(
            config.token,
            app.oauth.bypass,
            app.oauth.grant()
        );
    }

    if (typeof(config.authorize) === "string") {
        var checkClientId = function (req, res, next) {
            req.checkQuery("client_id", "required").notEmpty();
            req.checkQuery("client_id", "invalid").len(32);

            var errors = req.validate(true);
            if (errors) {
                return  next(Osf.Error("OAuth_Authorize_Error", "Client Id invalid", errors));
            }
            Client.findOne({clientId: req.query.client_id}, function (err, client) {
                if (err) {
                    return  next(err);
                }
                if (!client) {
                    return  next(Osf.Error("OAuth_Authorize_Error", "Client does not exist"));
                }
                req.clientId = client;
                return next();
            });
        };
        var authorize = function (req, res, next) {
            var method = req.method.toLowerCase();
            if (method === "get") {
                if (req.xhr) {
                    return res.jsonp(req.clientId ? {
                        connected: typeof(req.user) === "undefined" ? false : true,
                        client_id: req.clientId.clientId,
                        name: req.clientId.name,
                        url: req.clientId.url,
                        description: req.clientId.description,
                        redirect_uri: req.clientId.redirectUri
                    } : {});
                } else {
                    if (typeof(req.user) === "undefined") {
                        ctrl.default(req, res, next);
                    } else {
                        AllowedClient.findOne({
                            userId: req.user._id,
                            clientId: req.query.client_id
                        }, function (err, client) {
                            if (err) {
                                return next(err);
                            }
                            if (!client) {
                                if (req.clientId.autoApproved == "1") {
                                    var allowedClient = new AllowedClient({
                                        userId: req.user._id,
                                        clientId: req.query.client_id
                                    });
                                    allowedClient.save(function (err) {
                                        if (err) {
                                            return next(err);
                                        }
                                        return next();
                                    })
                                } else {
                                    return ctrl.default(req, res, next);
                                }
                            } else {
                                return next();
                            }
                        });
                    }
                }
            } else if (method === "post") {
                if (typeof(req.body.allow) !== "undefined") {
                    if (typeof(req.user) !== "undefined") {
                        var allowedClient = new AllowedClient({
                            userId: req.user._id,
                            clientId: req.query.client_id
                        });
                        allowedClient.save(function (err) {
                            if (err) {
                                return next(err);
                            }
                            return res.jsonp({"allow": true});
                        })
                    } else {
                        return  next(Osf.Error("OAuth_Allow_Error", "User not connected"));
                    }
                } else if (typeof(req.body.cancel) !== "undefined") {
                    return res.jsonp({"url": req.clientId ? req.clientId.url : app.get("pkg").hostname});
                } else {
                    req.checkBody('email', 'required').notEmpty();
                    req.checkBody('email', 'invalid').isEmail();
                    req.checkBody('password', 'required').notEmpty();
                    req.checkBody('password', 'min').len(8);

                    var errors = req.validate(true);
                    if (errors) {
                        return  next(Osf.Error("Signin_Error", "Request validation", errors));
                    }

                    app.get("passport").authenticate("local", function (err, person) {
                        if (err) {
                            return next(err);
                        }
                        if (person) {
                            req.login(person, function (errLogin) {
                                if (errLogin) {
                                    return next(errLogin);
                                }
                                if (typeof(req.body.rememberme) !== "undefined" && req.body.rememberme === "1") {
                                    var days = 7 * 24 * 3600000;
                                    req.session.cookie.expires = new Date(Date.now() + days);
                                    req.session.cookie.maxAge = days;
                                }

                                return res.jsonp({successful: true});
                            });
                        }
                    })(req, res, next);
                }
            } else {
                return next();
            }
        };

        ctrl.get(
            config.authorize,
            app.oauth.bypass,
            checkClientId,
            authorize,
            app.oauth.authCodeGrant(model.checkUserApproved)
        );
        ctrl.post(
            config.authorize,
            app.oauth.bypass,
            checkClientId,
            authorize,
            app.oauth.authCodeGrant(model.checkUserApproved)
        );
    }

    this.lockdown = function () {
        app.oauth.lockdown(app);
    };
};