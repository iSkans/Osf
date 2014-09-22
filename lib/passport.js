'use strict';

var _ = require('lodash'),
    async = require('async'),
    mongoose = require('mongoose'),
    passport = require('passport'),
    LocalStrategy = require('passport-local').Strategy,
    OAuth2Strategy = require('passport-oauth2').Strategy,

//TwitterStrategy = require('passport-twitter').Strategy,
//FacebookStrategy = require('passport-facebook').Strategy,
//GoogleStrategy = require('passport-google-oauth').Strategy,
    Osf = _.assign({}, require(__dirname + '/string'), require(__dirname + '/error'));

module.exports.Passport = exports.Passport = function (app) {
    var Account = mongoose.model('OAuthAccount'),
        Person = mongoose.model('OAuthUser'),
        OAuthClient = mongoose.model('OAuthClient'),
        OAuthAccessToken = mongoose.model('OAuthAccessToken'),
        OAuthRefreshToken = mongoose.model('OAuthRefreshToken'),
        pkg = app.get("pkg"),
        crypto = app.get("crypto");

    async.auto({
        //-- Check Admin Account --//
        "adminAccount": function (callback) {
            if (typeof(pkg.author.name) !== "undefined" && typeof(pkg.author.email) !== "undefined") {
                Account.
                    findOne({email: pkg.author.email}).
                    exec(function (err, account) {
                        if (err) {
                            return callback(err);
                        }

                        //-- Update admin account --//
                        if (account) {
                            account.primary = 1;
                            account.activation = {value: 1};
                            account.invited = 1;
                        }

                        //-- Create admin account --//
                        else {
                            account = new Account({
                                primary: 1,
                                email: pkg.author.email,
                                activation: {
                                    value: 1
                                },
                                invited: 1
                            });
                        }

                        //-- Save admin account --//
                        account.save(function (err, account) {
                            if (err) {
                                return callback(err);
                            }
                            return callback(null, account);
                        });
                    });
            } else {
                callback(Osf.Error("Passport_Error", "Please define the author (name, email) in package.json."));
            }
        },

        //-- Check Admin Person
        "adminPerson": ["adminAccount", function (callback, results) {
            var adminAccount = results.adminAccount;
            //-- Find admin person --//
            Person.
                findOne({username: pkg.author.name}).
                populate('accounts').
                exec(function (err, person) {
                    if (err) {
                        return callback(err);
                    }

                    var exist = false;
                    //-- Update admin person --//
                    if (person) {
                        //-- Disable old primary account --//
                        async.map(person.accounts, function (account, done) {
                            if (account.id === adminAccount.id) {
                                exist = true;
                                done(null, account);
                            } else {
                                if (account.primary) {
                                    account.primary = 0;
                                    account.save(function (err, account) {
                                        if (err) {
                                            return done(err);
                                        }
                                        done(null, account);
                                    });
                                } else {
                                    done(null, account);
                                }
                            }
                        }, function (err, accounts) {
                            if (err) {
                                return callback(err);
                            }

                            //-- Add new account into admin person --//
                            if (!exist) {
                                person.accounts.push(adminAccount);
                                person.markModified("accounts");
                            }

                            var roles = person.roles.toObject();
                            if (!_.contains(roles, "admin")) {
                                person.roles.push("admin");
                            }
                            person.markModified("roles");

                            person.save(function (err, person) {
                                if (err) {
                                    return callback(err);
                                }
                                return callback(null, person);
                            });
                        });
                    }

                    //-- Create admin person --//
                    else {
                        person = new Person({
                            provider: pkg.domain,
                            username: pkg.author.name,
                            password: Osf.String.sha512(crypto.password, crypto.salt)
                        });
                        person.accounts.push(adminAccount);
                        person.roles.push("admin");
                        person.markModified("accounts");
                        person.save(function (err, person) {
                            if (err) {
                                return callback(err);
                            }
                            return callback(null, person);
                        });
                    }
                });
        }],

        //-- Check Team Account --//
        "teamAccount": function (callback) {
            if (typeof(pkg.contributors) !== "undefined") {
                async.map(pkg.contributors, function (contributor, done) {
                    if (typeof(contributor.name) !== "undefined" && typeof(contributor.email) !== "undefined") {
                        Account.
                            findOne({email: contributor.email}).
                            exec(function (err, account) {
                                if (err) {
                                    return done(err);
                                }

                                //-- Update admin account --//
                                if (account) {
                                    return done(null, account);
                                }

                                //-- Create admin account --//
                                account = new Account({
                                    primary: 1,
                                    email: contributor.email,
                                    activation: {
                                        value: 1
                                    },
                                    invited: 1
                                });

                                //-- Save admin account --//
                                account.save(function (err, account) {
                                    if (err) {
                                        return done(err);
                                    }
                                    return done(null, account);
                                });
                            });
                    } else {
                        return done(Osf.Error("Passport_Error", "Please define the contributor (name,email) in package.json."));
                    }
                }, function (err, data) {
                    if (err) {
                        return callback(err);
                    }

                    var id,
                        accounts = {};
                    for (id = 0; id < data.length; id++) {
                        accounts[data[id].email] = data[id];
                    }
                    return callback(null, accounts);
                });
            } else {
                return callback(null);
            }
        },

        //-- Check Team Person
        "teamPerson": ["teamAccount", function (callback, results) {
            var teamAccount = results.teamAccount;
            if (typeof(teamAccount) !== "undefined") {
                async.map(pkg.contributors, function (contributor, done) {
                    if (typeof(contributor.name) !== "undefined" && typeof(contributor.email) !== "undefined") {
                        Person.
                            findOne({username: contributor.name}).
                            populate('accounts').
                            exec(function (err, person) {
                                if (err) {
                                    return done(err);
                                }

                                var exist = false;
                                if (person) {
                                    for (var id = 0; id < person.accounts.length; id++) {
                                        if (person.accounts[id].id === teamAccount[contributor.email].id) {
                                            exist = true;
                                            break;
                                        }
                                    }
                                }
                                else {
                                    person = new Person({
                                        provider: pkg.domain,
                                        username: contributor.name,
                                        password: Osf.String.sha512(crypto.password, crypto.salt)
                                    });
                                }

                                //-- Add new account into team person --//
                                if (!exist) {
                                    person.accounts.push(teamAccount[contributor.email]);
                                    person.markModified("accounts");
                                }
                                var roles = person.roles.toObject();
                                if (!_.contains(roles, "team")) {
                                    person.roles.push("team");
                                }
                                person.markModified("roles");
                                person.save(function (err, person) {
                                    if (err) {
                                        return done(err);
                                    }
                                    return done(null, person);
                                });
                            });
                    } else {
                        return done(Osf.Error("Passport_Error", "Please define the contributor (name,email) in package.json."));
                    }
                }, function (err, persons) {
                    if (err) {
                        return callback(err);
                    }
                    return callback(null, persons);
                });
            } else {
                return callback(null);
            }
        }]
    }, function (err, results) {
        if (err) {
            throw err;
        }
        app.emit("osf.passport.user.loaded")
    });

    app.use(passport.initialize());
    app.use(passport.session());

    //-- Serialize sessions --//
    passport.serializeUser(function (person, done) {
        done(null, person._id || person.id);
    });

    //-- Unserialize sessions --//
    passport.deserializeUser(function (id, next) {
        Person.
            findOne({
                "_id": id
            }).
            populate("accounts").
            exec(function (err, person) {
                if (err) {
                    return next(err);
                }
                if (person.token.refresh && person.token.expire < Date.now()) {
                    var provider = app.get("oauth-client")[person.provider];
                    if (provider) {
                        provider.oauth2.getOAuthAccessToken(person.token.refresh,
                            {
                                'grant_type': 'refresh_token'
                            },
                            function (err, access_token, refresh_token, params) {
                                console.log("Oauth Client User : [" + access_token + "," + refresh_token + "]");
                                if (err) {
                                    return next(err);
                                }

                                if (access_token) {
                                    person.token.access = access_token;
                                }
                                if (refresh_token) {
                                    person.token.refresh = refresh_token;
                                }
                                person.token.expire = new Date(Date.now() + (params.expire_in ? (params.expire_in - 300) * 1000 : 3300000));
                                person.save(function (errSave) {
                                    if (errSave) {
                                        return next(errSave);
                                    }
                                    return next(null, person);
                                });
                            });
                    } else {
                        return next(null, person);
                    }
                } else {
                    return next(null, person);
                }
            });
    });


    //-- Local passport --//
    passport.use(new LocalStrategy({
        usernameField: 'email',
        passwordField: 'password'
    }, function (email, password, next) {
        //console.log("SHA1 : "+Osf.String.sha1(password,''));
        var sha1 = Osf.String.sha1(password);
        var sha512 = Osf.String.sha512(password, app.get("crypto").salt);
        Person.
            find({
                $or: [
                    {
                        password: sha512,
                        disabled: 0
                    },
                    {
                        password: sha1,
                        disabled: 0
                    }
                ]
            }).
            populate({
                path: "accounts",
                match: {
                    email: Osf.String.lowercase(email),
                    invited: 1
                },
                select: "email username domain activation"
            }).
            exec(function (err, persons) {
                if (err) {
                    return next(err);
                }
                if (persons.length === 0) {
                    return next(Osf.Error("Signin_Error", "Password invalid", {password: "invalid"}));
                }

                var idx, person;
                for (idx = 0; idx < persons.length; idx++) {
                    person = persons[idx];
                    if (0 < person.accounts.length) {
                        if (person.accounts[0].activation.value) {
                            if (person.password === sha1) {
                                person.password = sha512;
                                person.save(function (err, person) {
                                    return next(null, person);
                                });
                            } else {
                                return next(null, person);
                            }
                        } else {
                            return next(Osf.Error("Signin_Error", "Email is not activated", {email: "activated"}));
                        }
                    }
                }
                return next(Osf.Error("Signin_Error", "Email invalid", {email: "email"}));
            });
    }));

    var strategy = app.get("passport-server");
    //console.log(strategy);
    //process.exit(0);

    //https://www.facebook.com/v2.0/dialog/oauth?client_id=138566025676&redirect_uri=https://www.airbnb.fr/authenticate&scope=email,user_birthday,user_likes,user_education_history,user_hometown,user_interests,user_activities,user_location,user_friends
    if (typeof(strategy.oauth2) !== "undefined") {
        OAuth2Strategy.prototype.userProfile = function (accessToken, done) {
            this._oauth2.get(strategy.oauth2.profileUrl, accessToken, function (err, json, res) {
                if (err) {
                    return done(Osf.Error("Signin_Error", 'Failed to fetch user profile', err));
                }

                try {
                    var profile = JSON.parse(json);
                    return done(null, profile);
                } catch (e) {
                    return done(Osf.Error("Signin_Error", 'Failed to fetch user profile', err));
                }
            });
        };

        passport.use("oauth2-local", new OAuth2Strategy(
            strategy.oauth2,
            function (access_token, refresh_token, params, profile, done) {
                console.log("Oauth Client User : [" + access_token + "," + refresh_token + "]");
                async.auto({
                    "person": function (callback) {
                        Person.
                            findOne({
                                "_id": profile._id || profile.id
                            }).
                            exec(function (err, person) {
                                if (err) {
                                    return callback(err);
                                }
                                if (!person) {
                                    return callback(Osf.Error("Signin_Error", "Profile does not exist.", profile));
                                }
                                return callback(null, person);
                            });
                    },
                    "save": ["person", function (callback, results) {
                        if (results.person) {
                            results.person.token.access = access_token;
                            results.person.token.refresh = refresh_token;
                            results.person.token.expire = new Date(Date.now() + (params.expire_in ? (params.expire_in - 300) * 1000 : 3300000));
                            results.person.save(function (err) {
                                if (err) {
                                    return callback(err);
                                }

                                //var days = 7 * 24 * 3600000;
                                //req.session.cookie.expires = new Date(Date.now() + days);
                                //req.session.cookie.maxAge = days;

                                return callback(null, results.person);
                            });
                        }
                    }]
                }, function (err, results) {
                    if (err) {
                        return done(err);
                    }
                    done(null, results.person);
                });
            }
        ));
    }


    /*
     //-- Twitter passport --//
     passport.use(new TwitterStrategy({
     consumerKey: config.twitter.clientID,
     consumerSecret: config.twitter.clientSecret,
     callbackURL: config.twitter.callbackURL
     }, function (token, tokenSecret, profile, done) {
     Person.findOne({
     'twitter.id_str': profile.id
     }, function (err, user) {
     if (err) {
     return done(err);
     }
     if (!user) {
     user = new User({
     name: profile.displayName,
     username: profile.username,
     provider: 'twitter',
     twitter: profile._json
     });
     user.save(function (err) {
     if (err) console.log(err);
     return done(err, user);
     });
     } else {
     return done(err, user);
     }
     });
     }));

     //-- Facebook passport --//
     passport.use(new FacebookStrategy({
     clientID: config.facebook.clientID,
     clientSecret: config.facebook.clientSecret,
     callbackURL: config.facebook.callbackURL
     }, function (accessToken, refreshToken, profile, done) {
     Person.findOne({
     'facebook.id': profile.id
     }, function (err, user) {
     if (err) {
     return done(err);
     }
     if (!user) {
     user = new User({
     name: profile.displayName,
     email: profile.emails[0].value,
     username: profile.username,
     provider: 'facebook',
     facebook: profile._json
     });
     user.save(function (err) {
     if (err) console.log(err);
     return done(err, user);
     });
     } else {
     return done(err, user);
     }
     });
     }));

     //Use google strategy
     passport.use(new GoogleStrategy({
     consumerKey: config.google.clientID,
     consumerSecret: config.google.clientSecret,
     callbackURL: config.google.callbackURL
     }, function (accessToken, refreshToken, profile, done) {
     Person.findOne({
     'google.id': profile.id
     }, function (err, user) {
     if (!user) {
     user = new User({
     name: profile.displayName,
     email: profile.emails[0].value,
     username: profile.username,
     provider: 'google',
     google: profile._json
     });
     user.save(function (err) {
     if (err) console.log(err);
     return done(err, user);
     });
     } else {
     return done(err, user);
     }
     });
     }));
     */
    app.set("passport", passport);
};
