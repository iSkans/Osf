'use strict';

var _ = require('lodash'),
    fs = require('fs'),
    path = require('path'),
    async = require('async'),
    mongoose = require('mongoose'),
    Osf = require("osf");

module.exports.Acl = exports.Acl = function (host, config) {
    var Acl = this,
        Resource = mongoose.model('OAuthResource'),
        hostname = host;
    this.routes = {};
    this.roles = {};
    this.activated = false;

    this.init = function (config) {
        if (fs.existsSync(config)) {
            var route,
                role,
                json = fs.readFileSync(config, "utf8");

            try {
                json = JSON.parse(json);
                for (route in json) {
                    for (role in json[route]) {
                        if (Acl.roles[json[route][role]] === undefined) {
                            Acl.roles[json[route][role]] = {};
                        }
                        Acl.roles[json[route][role]][route] = null;
                    }
                }
                Acl.activated = true;
            } catch (e) {
                throw Osf.Error("Acl_Error", "acl.json is invalid.");
            }
        }
    };

    /**
     * Add Route Resouce into Acl Manager
     * @param acl
     */
    this.append = function (acl) {
        //console.log(acl);
        this.routes[acl.type + ":" + acl.route] = acl;
    };

    /**
     * Save Acl into Database
     */
    this.update = function () {
        var routes = this.routes;
        var roles = this.roles;
        async.auto({
            //-- Find all resources from hostname --//
            "Resources": function (callback) {
                var idx,
                    resources = [];
                for (idx in routes) {
                    resources.push(routes[idx]);
                }
                callback(null, resources);
            },

            "findResources": function (callback) {
                Resource.
                    find({
                        provider: hostname
                    }).
                    exec(function (err, data) {
                        if (err) {
                            return callback(err);
                        }

                        var id,
                            resources = {};
                        for (id in data) {
                            resources[data[id].type + ":" + data[id].route] = data[id];
                        }
                        callback(null, resources);
                    });
            },
            "updateResources": ["Resources", "findResources", function (callback, results) {
                var resources = results.findResources;
                async.map(results.Resources, function (data, done) {
                    var resource;
                    if (typeof(resources[data.type + ":" + data.route]) === "undefined") {
                        resource = new Resource(data);
                    } else {
                        resource = resources[data.type + ":" + data.route];
                        resource.templateUrl = undefined;
                        resource.disableCache = undefined;
                        resource.set(data);
                    }
                    resource.save(function (err, resource) {
                        if (err) {
                            return done(err);
                        }
                        return done(null, resource);
                    });
                }, function (err, allResources) {
                    if (err) {
                        return callback(err);
                    }

                    var idx;
                    for (idx in allResources) {
                        routes[allResources[idx].type + ":" + allResources[idx].route] = allResources[idx];
                    }
                    return callback(null, allResources);
                });
            }],
            "deleteResources": ["updateResources", function (callback, results) {
                var resources = results.findResources,
                    toDelete = [],
                    idx;

                for (idx in resources) {
                    if (typeof(routes[idx]) === "undefined") {
                        toDelete.push(resources[idx]._id);
                    }
                }

                if (0 < toDelete.length) {
                    Resource.remove({ _id: {$in: toDelete}}, function (err) {
                        if (err) {
                            return callback(err);
                        }
                        return callback(null);
                    })
                } else {
                    callback(null);
                }
            }],
            "updateRoles": ["updateResources", function (callback, results) {
                var role,
                    route;
                for (role in roles) {
                    for (route in roles[role]) {
                        if (typeof(routes[route]) !== "undefined") {
                            roles[role][route] = routes[route];
                        } else {
                            delete roles[role][route];
                        }
                    }
                }
                callback(null);
            }]
        }, function (err, results) {
            if (err) {
                throw err;
            }
        });
    };

    /**
     * Get All route for a acl role
     * @param role
     * @returns {*}
     */
    this.getRoutes = function (role) {
        if (typeof(this.roles[role]) !== "undefined") {
            return this.roles[role];
        }
        return {};
    };

    /**
     * Middleware check if a user has access to a route.
     * @returns {Function}
     */
    this.check = function (req, res, next) {
        var route,
            regex,
            roles,
            role,
            idx,
            method = req.method.toLowerCase();

        if (method === "head" || method === "option") {
            return next();
        }

        if (typeof(req.user) === "undefined") {
            roles = ["guest"];
        } else {
            roles = req.user.roles.toObject();
        }
        for (idx in roles) {
            role = roles[idx];
            for (route in Acl.roles[role]) {
                regex = new RegExp(Acl.roles[role][route].regex);
                if (regex.test(req._parsedUrl.pathname) && Acl.roles[role][route].type === method) {
                    return next();
                }
            }
        }
        return next(Osf.Error("Acl_Error", "The user does not have access to this page.", undefined, 401));

    };

    this.init(config);
};