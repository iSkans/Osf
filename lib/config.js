'use strict';

var _ = require('lodash'),
    path = require('path');

/**
 * Osf Configuration.
 * @param rootPath Root directory
 * @param publicPath Public directory
 * @returns {*} Configuration
 */
module.exports.Config = exports.Config = function (rootPath, publicPath) {
    var argv = process.argv.slice(2),
    env = "development";
    if(0 < argv.length && (argv[0] === "development" || argv[0] === "testing" || argv[0] === "production")){
        env = argv[0];
    } else {
        env = process.env.NODE_ENV || "development";
    }

    this.data = {
        "passport-server": {},
        "oauth-client": {},
        oauth2 : {
            activated : false,
            debug : true,
            grants : ['authorization_code'],
            signin : "/profile/signin",
            allow : "/oauth/allow",
            token : {
                route: "/oauth/token"
            },
            authorize : {
                route: "/oauth/authorize",
                tpl: "/views/oauth/authorize.html",
                bind: "ctrl.oauth.authorize",
                cache: false
            }
        },
        path: {
            root: path.normalize(rootPath),
            public: path.normalize(publicPath)
        },
        env: env || "development"
    };
    _.merge(this.data,
        {
            pkg: require(this.data.path.root + '/package.json')
        },
        require(this.data.path.root + '/config/default.json'),
            require(this.data.path.root + '/config/' + this.data.env + '.json') || {}
    );
    return this.data;
};

