'use strict';

var _ = require('lodash'),
    OAuth2 = require('oauth').OAuth2,
    mongoose = require('mongoose'),
    querystring = require('querystring'),
    Osf = require("osf");

module.exports.BearerToken = exports.BearerToken = function (req, res, next) {
    var AccessToken = mongoose.model('OAuthAccessToken'),
        headerToken = req.get('Authorization'),
        getToken = req.query.access_token,
        postToken = req.body ? req.body.access_token : undefined,
        methodsUsed = (headerToken !== undefined) + (getToken !== undefined) + (postToken !== undefined);

    if (methodsUsed > 1) {
        return next(Osf.Error("Token_Error","Many bearer tokens had been receipt."));
    } else if (methodsUsed === 0) {
        return next();
    }

    // Header: http://tools.ietf.org/html/rfc6750#section-2.1
    if (headerToken) {
        var matches = headerToken.match(/Bearer\s(\S+)/);

        if (!matches) {
            return next(Osf.Error("Token_Error","Malformed bearer token."));
        }
        headerToken = matches[1];
    }

    // POST: http://tools.ietf.org/html/rfc6750#section-2.2
    if (postToken) {
        if (req.method === 'GET') {
            return next(Osf.Error("Token_Error","Bearer token detected in the body."));
        }

        if (!req.is('application/x-www-form-urlencoded')) {
            return next(Osf.Error("Token_Error","Bearer token must be in content type application/x-www-form-urlencoded."));
        }
    }
    var bearerToken = headerToken || postToken || getToken;

    AccessToken.
        findOne({ value: bearerToken }).
        populate("user").
        exec(function (err, token) {
            if (err) {
                return next(err);
            }

            if (!token) {
                return next(Osf.Error("OAuth_Invalid_Token_Error","The provided access token is invalid."));
            }

            if (token.expires && token.expires < Date.now()) {
                return next(Osf.Error("OAuth_Expired_Token_Error","The provided access token has expired."));
            }

            req.oauth = {
                bearerToken: headerToken || postToken || getToken
            };
            req.user = token.user ? token.user : req.user;
            next();
        });
};