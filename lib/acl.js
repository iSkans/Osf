/**
 * Requirements
 */
var mongoose = require('mongoose'),
    Events = require('events'),
    async = require('async'),
    _ = require('underscore'),
    Osf = {};
    _.extend(
        Osf,
        require(__dirname + '/string'),
        require(__dirname + '/error')
    ),
    $class = {};

$class.init = function (config, routes) {
    var Resource = mongoose.model('acl-resource'),
        Role = mongoose.model('acl-role'),
        Account = mongoose.model('account'),
        Person = mongoose.model('person');

    async.auto({
        //-- Find all roles --//
        "findRoles": function (callback) {
            Role.
                find().
                populate('resources').
                exec(function (err, data) {
                    if (err) {
                        callback(err);
                        return;
                    }

                    var id,
                        roles = {};
                    for (id in data) {
                        roles[data[id].name] = data[id];
                    }
                    callback(null, roles);
                });
        },
        //-- Find new role --//
        "findNewRoles": [ "findRoles", function (callback, results) {
            var id,
                newRoles = [],
                roles = results.findRoles,
                configRoles = config.acl.roles;

            for (id in configRoles) {
                if (typeof(roles[id]) !== "object") {
                    newRoles.push({
                        type: configRoles[id].type,
                        name: configRoles[id].name,
                        description: configRoles[id].description
                    });
                }
            }
            callback(null, newRoles);
        }],
        //-- Add new roles --//
        "addRoles": [ "findNewRoles", function (callback, results) {
            var roles = results.findRoles,
                newRoles = results.findNewRoles;
            async.map(newRoles, function (data, done) {
                var role = new Role(data);
                role.save(function (err, role) {
                    if (err) {
                        done(err);
                        return;
                    }
                    done(err, role);
                });
            }, function (err, addedRoles) {
                var id;
                for (id in addedRoles) {
                    roles[addedRoles[id].name] = addedRoles[id]
                }
                callback(null, addedRoles);
            });
        }],
        //-- Find all resources --//
        "findResources": function (callback) {
            Resource.
                find({
                    site: config.name
                }).
                exec(function (err, data) {
                    if (err) {
                        callback(err);
                        return;
                    }

                    var id,
                        resources = {};
                    for (id in data) {
                        resources[data[id].cache] = data[id];
                    }
                    callback(null, resources);
                });
        },
        //-- Detect resources --//
        "detectResources": [ "findResources", function (callback, results) {
            var id,
                url,
                urls,
                paths = {},
                route,
                detectedResources = {};

            //-- Retrieve paths --//
            for (id in routes) {
                urls = routes[id];
                for (url in urls) {
                    paths[urls[url].path] = null;
                }
            }

            //-- Retrieve modules & services --//
            for (path in paths) {
                route = path.split("/");
                if (1 < route.length) {
                    if (route[0] !== "") {
                        continue;
                    } else {
                        route[0] = config.name;
                    }

                    if (2 === route.length) {
                        if (route[1] === "") {
                            route[1] = "main";
                            route[2] = "index";
                        } else {
                            route[2] = route[1];
                            route[1] = "main";
                        }
                    }

                    id = route.join(".");
                    if (3 === route.length) {
                        detectedResources[id] = route;
                    }
                }
            }
            callback(null, detectedResources);
        }],
        //-- Find new resources --//
        "findNewResources": [ "detectResources", function (callback, results) {
            var id,
                oldResources = [],
                newResources = [],
                app = config.name + ".",
                detectedResources = results.detectResources;

            //-- Delete old resources --//
            for (id in results.findResources) {
                if (typeof(detectedResources[id]) === "object") {
                    delete detectedResources[id];
                } else if (Osf.string.startsWith(id, app)) {
                    oldResources.push(results.findResources[id]);
                }
            }

            //-- Find new resources --//
            async.map(oldResources, function (resource, done) {
                results.findResources[resource.cache].
                    remove(function (err) {
                        if (err) {
                            done(err);
                            return;
                        }
                        delete results.findResources[resource.cache];
                        done(null, resource);
                    });
            }, function (err, addedResources) {
                for (id in detectedResources) {
                    if (typeof(results.findResources[id]) !== "object") {
                        newResources.push({
                            cache: id,
                            site: detectedResources[id][0],
                            module: detectedResources[id][1],
                            service: detectedResources[id][2]
                        });
                    }
                }
                callback(null, newResources);
                ;
            });
        }],
        "addResources": ["findNewResources", function (callback, results) {
            var resources = results.findResources,
                newResources = results.findNewResources;
            async.map(newResources, function (data, done) {
                var resource = new Resource(data);
                resource.save(function (err, resource) {
                    if (err) {
                        done(err);
                        return;
                    }
                    done(null, resource);
                });
            }, function (err, addedResources) {
                var id;
                for (id in addedResources) {
                    resources[addedResources[id].cache] = addedResources[id]
                }
                callback(null, addedResources);
            });
        }],
        "associateResourceToRole": ["addRoles", "addResources", function (callback, results) {
            var id,
                role,
                resource,
                roles = [],
                findRoles = results.findRoles,
                resources = results.findResources,
                app = config.name + ".";

            for (id in findRoles) {
                roles.push(findRoles[id]);
            }

            async.map(roles, function (role, done) {
                var detectedResources = {},
                    updatedResources = [];

                //-- Delete old resources --//
                for (id = 0; id < role.resources.length; id++) {
                    resource = role.resources[id].cache;
                    if (Osf.string.startsWith(resource, app)) {
                        if (typeof(resources[resource]) !== "undefined" && typeof(detectedResources[resource]) === "undefined") {
                            updatedResources.push(role.resources[id]);
                            detectedResources[resource] = true;
                        }
                    } else {
                        updatedResources.push(role.resources[id]);
                        detectedResources[role.resources[id].cache] = true;
                    }
                }

                //-- Add new ressources --//
                if (role.name === "administrator") {
                    for (id in resources) {
                        if (typeof(detectedResources[id]) === "undefined") {
                            detectedResources[id] = true;
                            updatedResources.push(resources[id]);
                        }
                    }
                } else {
                    if (typeof(config.acl.roles[role.name].resources) === "object") {
                        for (resource = 0; resource < config.acl.roles[role.name].resources.length; resource++) {
                            id = config.acl.roles[role.name].resources[resource];
                            if (typeof(resources[id]) !== "undefined" && typeof(detectedResources[id]) === "undefined") {
                                updatedResources.push(resources[id]);
                                detectedResources[id] = true;
                            }
                        }
                    }
                }

                role.resources = updatedResources;
                role.markModified('resources');
                //console.log("Role:"+role.name);
                //console.log("Role Resources:"+role.resources.length);

                role.save(function (err, role) {
                    if (err) {
                        done(err);
                        return;
                    }
                    done(null, role);
                });
            }, function (err, roles) {
                callback(null, roles);
            });
        }],
        //-- Check Admin Account --//
        "checkAdminAccount": function (callback) {
            //-- Find admin account --//
            Account.
                findOne({email: config.author.email}).
                exec(function (err, account) {
                    if (err) {
                        callback(err);
                        return;
                    }

                    //-- Update admin account --//
                    if (account) {
                        account.primary = true;
                        account.activation = {value: true};
                        account.invited = true;
                        account.updated = new Date();
                    }

                    //-- Create admin account --//
                    else {
                        account = new Account({
                            primary: true,
                            email: config.author.email,
                            activation: {
                                value: true
                            },
                            invited: true
                        });
                    }

                    //-- Save admin account --//
                    account.save(function (err, account) {
                        if (err) {
                            callback(err);
                            return;
                        }
                        callback(null, account);
                    });
                });
        },

        //-- Check Admin Person
        "checkAdminPerson": ["checkAdminAccount", function (callback, results) {
            var adminAccount = results.checkAdminAccount;

            //-- Find admin person --//
            Person.
                findOne({username: config.author.name}).
                populate('accounts roles').
                exec(function (err, person) {
                    if (err) {
                        callback(err);
                        return;
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
                                    account.primary = false;
                                    account.save(function (err, account) {
                                        if (err) {
                                            done(err);
                                            return;
                                        }
                                        done(null, account);
                                    });
                                } else {
                                    done(null, account);
                                }
                            }
                        }, function (err, accounts) {
                            if (err) {
                                callback(err);
                                return;
                            }
                        });
                    }

                    //-- Create admin person --//
                    else {
                        person = new Person({
                            username: config.author.name,
                            password: Osf.string.sha512(config.default.password, config.crypto.salt)
                        });
                    }

                    //-- Add new account into admin person --//
                    if (!exist) {
                        person.accounts.push(adminAccount);
                        person.markModified("accounts");
                        person.save(function (err, person) {
                            if (err) {
                                callback(err);
                                return;
                            }
                            callback(null, person);
                        });
                    } else {
                        callback(null, person);
                    }
                });
        }],
        "checkAdminRole": ["addRoles", "checkAdminPerson", function (callback, results) {
            var id,
                role,
                findRoles = results.findRoles,
                adminPerson = results.checkAdminPerson,
                exist = false;

            if (typeof(findRoles["administrator"]) === "undefined") {
                callback(new Error("Administrator Role can not be find."));
                return;
            }

            //-- Check exist role admin association --//
            for (id = 0; id < adminPerson.roles.length; id++) {
                if (adminPerson.roles[id].id === findRoles["administrator"].id) {
                    exist = true;
                    break;
                }
            }

            if (!exist) {
                adminPerson.roles.push(findRoles["administrator"]);
                adminPerson.markModified("roles");
                adminPerson.save(function (err, adminPerson) {
                    if (err) {
                        callback(err);
                        return;
                    }
                    callback(null, adminPerson);
                });
            } else {
                callback(null, adminPerson);
            }
        }],
        //-- Check Team Account --//
        "checkTeamAccount": function (callback) {
            if (typeof(config.contributors) !== "undefined") {
                async.map(config.contributors, function (contributor, done) {
                    //-- Find team account --//
                    Account.
                        findOne({email: contributor.email}).
                        exec(function (err, account) {
                            if (err) {
                                done(err);
                                return;
                            }

                            //-- Update admin account --//
                            if (account) {
                                done(null, account);
                                return;
                            }

                            //-- Create admin account --//
                            account = new Account({
                                primary: true,
                                email: person.email,
                                activation: {
                                    value: true
                                },
                                invited: true
                            });

                            //-- Save admin account --//
                            account.save(function (err, account) {
                                if (err) {
                                    done(err);
                                    return;
                                }
                                done(null, account);
                            });
                        });
                }, function (err, data) {
                    if (err) {
                        callback(err);
                        return;
                    }

                    var id,
                        accounts = {};
                    for (id = 0; id < data.length; id++) {
                        accounts[data[id].email] = data[id];
                    }
                    callback(null, accounts);
                });
            } else {
                callback(null);
            }
        },

        //-- Check Team Person
        "checkTeamPerson": ["checkTeamAccount", function (callback, results) {
            var teamAccount = results.checkTeamAccount;
            if (typeof(teamAccount) !== "undefined") {
                async.map(config.contributors, function (contributor, done) {
                    if (typeof(teamAccount[contributor.email]) !== "undefined") {
                        //-- Find team person --//
                        Person.
                            findOne({username: contributor.name}).
                            populate('accounts roles').
                            exec(function (err, person) {
                                if (err) {
                                    done(err);
                                    return;
                                }

                                var exist = false;
                                //-- Find team account --//
                                if (person) {
                                    var id
                                    for (id = 0; id < person.accounts.length; id++) {
                                        if (person.accounts[id].id === teamAccount[contributor.email].id) {
                                            exist = true;
                                            break;
                                        }
                                    }
                                }

                                //-- Create admin person --//
                                else {
                                    person = new Person({
                                        username: contributor.name,
                                        password: Osf.string.sha512(config.default.password, config.crypto.salt)
                                    });
                                }

                                //-- Add new account into team person --//
                                if (!exist) {
                                    person.accounts.push(teamAccount[contributor.email]);
                                    person.markModified("accounts");
                                    person.save(function (err, person) {
                                        if (err) {
                                            done(err);
                                            return;
                                        }
                                        done(null, person);
                                    });
                                } else {
                                    done(null, person);
                                }
                            });
                    } else {
                        done(new Error(contributor.name + "'s account does not exist."));
                    }
                }, function (err, persons) {
                    if (err) {
                        callback(err);
                        return;
                    }
                    callback(null, persons);
                });
            } else {
                callback(null);
            }
        }],
        "checkTeamRole": ["addRoles", "checkTeamPerson", function (callback, results) {
            var findRoles = results.findRoles,
                teamPersons = results.checkTeamPerson;

            if (typeof(findRoles["team"]) === "undefined") {
                callback(new Error("Team role does not exist."));
                return;
            } else if (typeof(teamPersons) !== "undefined") {
                async.map(teamPersons, function (person, done) {
                    var id,
                        exist = false;
                    //-- Check person has team role --//
                    for (id = 0; id < person.roles.length; id++) {
                        if (person.roles[id].id === findRoles["team"].id) {
                            exist = true;
                            break;
                        }
                    }

                    //-- Add person to team role --//
                    if (!exist) {
                        person.roles.push(findRoles["team"]);
                        person.markModified("roles");
                        person.save(function (err, person) {
                            if (err) {
                                done(err);
                                return;
                            }
                            done(null, person);
                        });
                    } else {
                        done(null, person);
                    }
                }, function (err, persons) {
                    if (err) {
                        callback(err);
                        return;
                    }
                    callback(null, persons);
                });
            } else {
                callback(null);
            }
        }]
    }, function (err, results) {
        if (err) {
            throw err;
        }
        console.log("Acl         : Ok");
    });
};

$class.addResource = function (req, resource) {
    if (typeof(req.acl) === "undefined") {
        req.acl = {};
    }

    if (typeof(req.acl[resource.site]) === "undefined") {
        req.acl[resource.site] = {};
    }

    if (typeof(req.acl[resource.site][resource.module]) === "undefined") {
        req.acl[resource.site][resource.module] = {};
    }

    if (typeof(req.acl[resource.site][resource.module][resource.service]) === "undefined") {
        req.acl[resource.site][resource.module][resource.service] = true;
    }
}

$class.checker = function (config) {
    var Resource = mongoose.model('acl-resource'),
        Role = mongoose.model('acl-role'),
        Account = mongoose.model('account'),
        Person = mongoose.model('person');

    return function (req, res, next) {
        route = req.url.split("/");
        if (1 < route.length) {
            if (route[0] !== "") {
                throw new Error("Route is invalid");
            } else {
                route[0] = config.name;
            }

            if (2 === route.length) {
                if (route[1] === "") {
                    route[1] = "main";
                    route[2] = "index";
                } else {
                    route[2] = route[1];
                    route[1] = "main";
                }
            }

            if (typeof(req.user) === "undefined") {
                Role.
                    findOne({
                        name: "visitor"
                    }).
                    populate({
                        path: "resources",
                        match: {
                            site: route[0],
                            module: route[1]
                        }
                    }).exec(function (err, role) {
                        if (err) {
                            throw new Error("Visitor role does not exist.");
                            return;
                        }

                        var id;
                        for (id = 0; id < role.resources.length; id++) {
                            $class.addResource(req, role.resources[id]);
                        }

                        if (typeof(req.acl) !== "undefined" &&
                            typeof(req.acl[route[0]]) !== "undefined" &&
                            typeof(req.acl[route[0]][route[1]]) !== "undefined" &&
                            typeof(req.acl[route[0]][route[1]][route[2]]) !== "undefined"
                            ) {
                            next();
                        } else {
                            return next(Osf.error.msg(res.__("The user does not have access to this page."),"401"));

                            //res.status(401).jsonp({"message": "Unauthorized."})
                            //return;
                        }
                    });
            } else {
                console.log("user connected");
                next();
            }
        } else {
            throw new Error("Route is invalid");
        }
    };
};

//-- Export Class --//
if (typeof exports !== 'undefined') {
    if (typeof module !== 'undefined' && module.exports) {
        module.exports.acl = $class;
    }
    exports.acl = $class;
}