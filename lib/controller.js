'use strict';

/**
 * Requirements
 */
var Osf = require(__dirname + "/../"),
    _ = require("lodash");

var Controller = module.exports.Controller = exports.Controller = function (name, app) {
        var tokens = app.settings.tokens = app.settings.tokens || {};
        var csrf = app.settings.csrf;
        var acl = app.settings.acl;

        /**
         * Arguments <route, fnc1 [, fnc2, ...][,param1, param2, ...],>
         */
        var defineRoute = function (type, args) {
            if (args.length < 2) {
                throw Osf.Error("Controller_Error","Controller must have at least 2 parameters.");
            }
            if (typeof(args[0]) === "object") {
                var config = args[0],
                    detectFnc = false,
                    resource = {
                        "provider": app.settings.pkg.hostname,
                        "type": type
                    },
                    route,
                    idx;

                if (typeof(config.route) === "string") {
                    resource.route = config.route;
                    route = app.route(resource.route);
                } else {
                    throw Osf.Error("Controller_Error","You must define the route parameter.");
                }

                if (typeof(config.regex) === "string") {
                    resource.regex = "^" + config.regex + "$";
                } else {
                    resource.regex = "^" + resource.route + "$";
                }

                if (typeof(config.tpl) === "string") {
                    resource.templateUrl = config.tpl;
                }

                if (typeof(config.bind) === "string") {
                    resource.controller = config.bind;
                }

                if (typeof(config.cache) === "boolean") {
                    resource.disableCache = !config.cache;
                }

                for (idx = 1; idx < args.length; idx++) {
                    if (args[idx] instanceof Function) {
                        detectFnc = true;
                        if (type === "get") {
                            route.get(args[idx]);
                        } else if (type === "post") {
                            route.post(args[idx]);
                        } else if (type === "all") {
                            route.all(args[idx]);
                        } else if (type === "put") {
                            route.put(args[idx]);
                        } else if (type === "delete") {
                            route.delete(args[idx]);
                        }
                    }
                }

                if (!detectFnc) {
                    throw Osf.Error("Controller_Error","Controller must bind at least one function.");
                } else {
                    if (typeof(resource.templateUrl) !== "undefined") {
                        if (typeof(tokens[resource.route]) === "undefined") {
                            tokens[resource.route] = [];
                        }
                        if (typeof(tokens[resource.templateUrl]) === "undefined") {
                            tokens[resource.templateUrl] = [];
                        }
                        tokens[resource.route].push(resource.route);
                        tokens[resource.templateUrl].push(resource.route);

                        csrf.bind(resource.route, resource.route);
                        csrf.bind(resource.templateUrl, resource.route);
                    }
                    if (typeof(acl) !== "undefined") {
                        acl.append(resource);
                    }
                }
            }
            else if (typeof(args[0]) !== "string") {
                throw Osf.Error("Controller_Error","First parameter of controller must be a string.");
            } else {
                var idx,
                    detectFnc = false,
                    route = app.route(args[0]),
                    template = null,
                    regex = null,
                    cache = null,
                    resource,
                    ctrl = name.toLowerCase();
                for (idx = 1; idx < args.length; idx++) {
                    if (args[idx] instanceof Function) {
                        detectFnc = true;
                        if (type === "get") {
                            route.get(args[idx]);
                        } else if (type === "post") {
                            route.post(args[idx]);
                        } else if (type === "all") {
                            route.all(args[idx]);
                        } else if (type === "put") {
                            route.put(args[idx]);
                        } else if (type === "delete") {
                            route.delete(args[idx]);
                        }
                    }

                    if (args[idx] instanceof Osf.Template) {
                        template = args[idx];
                    }

                    if (args[idx] instanceof RegExp) {
                        regex = args[idx];
                    }

                    if (args[idx] instanceof Osf.Cache) {
                        cache = args[idx];
                    }
                }

                if (!regex) {
                    regex = new RegExp("^" + args[0] + "$");
                }

                if (!detectFnc) {
                    throw Osf.Error("Controller_Error","Controller must at have least 1 function into parameters.");
                } else if (template) {
                    if (typeof(tokens[args[0]]) === "undefined") {
                        tokens[args[0]] = [];
                    }
                    if (typeof(tokens['/views' + template.url]) === "undefined") {
                        tokens['/views' + template.url] = [];
                    }
                    tokens[args[0]].push(args[0]);
                    tokens['/views' + template.url].push(args[0]);

                    csrf.bind(args[0], args[0]);
                    csrf.bind('/views' + template.url, args[0]);

                    var fnc = "",
                        tmp = args[0].split("/", 3);
                    for (var idx in tmp) {
                        if (tmp[idx] !== "" && tmp[idx] !== ctrl) {
                            fnc = tmp[idx];
                            break;
                        } else {
                            fnc = "";
                        }
                    }
                    if (fnc !== "") {
                        resource = {
                            regex: regex.source,
                            templateUrl: '/views' + template.url,
                            controller: 'ctrl.' + ctrl + "." + fnc
                        };

                        if (cache && !cache.isEnabled) {
                            resource.disableCache = true;
                        }
                    } else {
                        resource = {
                            regex: regex.source,
                            templateUrl: '/views' + template.url
                        };

                        if (cache && !cache.isEnabled) {
                            resource.disableCache = true;
                        }
                    }
                    if (typeof(acl) !== "undefined") {
                        acl.append(_.assign({
                            provider: app.settings.pkg.hostname,
                            route: args[0],
                            type: type
                        }, resource));
                    }
                } else {
                    if (typeof(acl) !== "undefined") {
                        acl.append(_.cloneDeep({
                            provider: app.settings.pkg.hostname,
                            route: args[0],
                            type: type,
                            regex: regex.source
                        }));
                    }
                }
            }
        }

        this.getName = function () {
            return name;
        }

        this.getRoutes = function () {
            return routes;
        }

        this.default = function (req, res, next) {
            return res.render('layout/default');
        }

        this.get = function () {
            defineRoute("get", arguments);
        }

        this.post = function () {
            defineRoute("post", arguments);
        }

        this.all = function () {
            defineRoute("all", arguments);
        }

        this.put = function () {
            defineRoute("put", arguments);
        }

        this.delete = function () {
            defineRoute("delete", arguments);
        }
    }
    ;