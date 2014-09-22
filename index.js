//     Osf.js 3.0.0
//     (c) 2013 Melo, melo@iskans.com
//     Osf may be freely distributed under the MIT license.

var _ = require('lodash'),
    fs = require('fs'),
    path = require('path');

module.exports = exports = new function () {
    this.VERSION = '3.0.2';
    this.init = function (rootPath, publicPath) {
        var Osf = this;

        //-- Load Osf libraries --//
        fs.readdirSync(path.join(__dirname, 'lib')).forEach(function (file) {
            if (file.substr(-3) === '.js') {
                _.assign(Osf, require(path.join(__dirname, 'lib', file)));
            }
        });

        //-- Initialize application --//
        Osf.App.init();

        //-- Load configuration --//
        Osf.App.configuration(Osf.Config(rootPath, publicPath));

        //-- Load models --//
        Osf.App.models();

        //-- Load translation --//
        Osf.App.i18n();

        //-- Load logger --//
        Osf.App.log();

        //-- Load database --//
        Osf.App.mongoose();

        //-- Load oauth client --//
        Osf.App.oauthClient();

        //-- Load passport --//
        Osf.App.passport();

        //-- Load ouath server --//
        Osf.App.oauthServer();

        //-- Load Csrf --//
        Osf.App.csrf();

        //-- Load public path --//
        Osf.App.public();

        //-- Load helmet --//
        Osf.App.helmet();

        //-- Load controllers --//
        Osf.App.controller();

        //-- Load Error manager --//
        Osf.App.error();
    }

    this.run = function () {
        this.App.run();
    }
};