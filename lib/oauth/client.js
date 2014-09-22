'use strict';

var _ = require('lodash'),
    OAuth2 = require('oauth').OAuth2,
    mongoose = require('mongoose'),
    qs = require('qs'),
    Osf = require('osf');

OAuth2.prototype.get = function (url, access_token, callback) {
    var headers = {
            'Content-Type': 'application/x-www-form-urlencoded'
        },
        access_token = access_token;
    if (this._useAuthorizationHeaderForGET) {
        headers['Authorization'] = this.buildAuthHeader(access_token),
            access_token = null;
    }
    this._request("GET", this._baseSite + url, headers, "", access_token, function (error, data, response) {
        if (error) {
            try {
                error.data = JSON.parse(error.data);
                if (error.data.name !== undefined && error.data.message !== undefined) {
                    return callback(Osf.Error(error.data.name, error.data.message, error.data));
                }
                return callback(Osf.Error("OAuthClient_Error","GET Request Error.",error.data));
            }
            catch (e) {
                return callback(error, data, response);
            }
        } else {
            try {
                data = JSON.parse(data);
                callback(error, data, response);
            }
            catch (e) {
                callback(error, data, response);
            }
        }
    });
};

OAuth2.prototype.delete = function (url, access_token, callback) {
    var headers = {
            'Content-Type': 'application/x-www-form-urlencoded'
        },
        access_token = access_token;
    if (this._useAuthorizationHeaderForGET) {
        headers['Authorization'] = this.buildAuthHeader(access_token),
            access_token = null;
    }
    this._request("DELETE", this._baseSite + url, headers, "", access_token, function (error, data, response) {
        if (error) {
            try {
                error.data = JSON.parse(error.data);
                if (error.data.name !== undefined && error.data.message !== undefined) {
                    return callback(Osf.Error(error.data.name, error.data.message, error.data));
                }
                return callback(Osf.Error("OAuthClient_Error","DELETE Request Error.",error.data));
            }
            catch (e) {
                return callback(error, data, response);
            }
        } else {
            try {
                data = JSON.parse(data);
                callback(error, data, response);
            }
            catch (e) {
                callback(error, data, response);
            }
        }
    });
};

OAuth2.prototype.post = function (url, access_token, data, callback) {
    var headers = {
            'Content-Type': 'application/x-www-form-urlencoded'
        },
        access_token = access_token,
        params = data || {};


    if (this._useAuthorizationHeaderForGET) {
        headers['Authorization'] = this.buildAuthHeader(access_token),
            access_token = null;
    }

    this._request("POST", this._baseSite + url, headers, qs.stringify(params), access_token, function (error, data, response) {
        if (error) {
            try {
                error.data = JSON.parse(error.data);
                if (error.data.name !== undefined && error.data.message !== undefined) {
                    return callback(Osf.Error(error.data.name, error.data.message, error.data));
                }
                return callback(Osf.Error("OAuthClient_Error","POST Request Error.",error.data));
            }
            catch (e) {
                return callback(error, data, response);
            }
        } else {
            try {
                data = JSON.parse(data);
                return callback(error, data, response);
            }
            catch (e) {
                return callback(error, data, response);
            }
        }
    });
};

OAuth2.prototype.put = function (url, access_token, data, callback) {
    var headers = {
            'Content-Type': 'application/x-www-form-urlencoded'
        },
        access_token = access_token,
        params = data || {};


    if (this._useAuthorizationHeaderForGET) {
        headers['Authorization'] = this.buildAuthHeader(access_token),
            access_token = null;
    }

    this._request("PUT", this._baseSite + url, headers, qs.stringify(params), access_token, function (error, data, response) {
        if (error) {
            try {
                error.data = JSON.parse(error.data);
                if (error.data.name !== undefined && error.data.message !== undefined) {
                    return callback(Osf.Error(error.data.name, error.data.message, error.data));
                }
                return callback(Osf.Error("OAuthClient_Error","PUT Request Error.",error.data));
            }
            catch (e) {
                return callback(error, data, response);
            }
        } else {
            try {
                data = JSON.parse(data);
                return callback(error, data, response);
            }
            catch (e) {
                return callback(error, data, response);
            }
        }
    });
};

module.exports.Client = exports.Client = function (options) {
    var Client = this;
    Client.options = options || {};

    if (typeof(Client.options.clientId) === "undefined" ||
        typeof(Client.options.clientSecret) === "undefined" ||
        typeof(Client.options.url) === "undefined" ||
        typeof(Client.options.authorization) === "undefined" ||
        typeof(Client.options.token) === "undefined") {
        throw Error("invalid_oauth_client", "OAuth Client configuration must contain {clientId, clientSecret, url, authorization, token}");
    }

    Client.oauth2 = new OAuth2(this.options.clientId, this.options.clientSecret, this.options.url, this.options.authorization, this.options.token);
    Client.oauth2._useAuthorizationHeaderForGET = true;

    Client.getOAuthAccessToken = function (code, params, callback) {
        Client.oauth2.getOAuthAccessToken(code, params, function (e, access_token, refresh_token, results) {
            if(callback){
                if(e){
                    try {
                        e.data = JSON.parse(e.data);
                        return callback(e);
                    }
                    catch (e) {
                        return callback(e);
                    }
                }
                results.refresh_token = refresh_token;
                return callback(null, results);
            } else {
                if(e){
                    return;
                }
                //console.log("Oauth Client : [" + access_token + "," + refresh_token + "]");
                Client.expires_in = results.expires_in || 3300;

                if (access_token) {
                    Client.access_token = access_token;
                }

                if (refresh_token) {
                    Client.refresh_token = refresh_token;
                    setTimeout(function () {
                        Client.getOAuthAccessToken(Client.refresh_token, {'grant_type': 'refresh_token'});
                    }, (Client.expires_in - 300) * 1000);
                } else {
                    setTimeout(function () {
                        Client.getOAuthAccessToken('', {'grant_type': 'client_credentials'});
                    }, (Client.expires_in - 300) * 1000);
                }
            }
        });
    }

    Client.get = function (url, callback, access_token) {
        access_token = access_token || this.access_token;
        this.oauth2.get(url, access_token, callback);
    }

    Client.delete = function (url, callback, access_token) {
        access_token = access_token || this.access_token;
        this.oauth2.delete(url, access_token, callback);
    }

    Client.post = function (url, data, callback, access_token) {
        access_token = access_token || this.access_token;
        this.oauth2.post(url, access_token, data, callback);
    }

    Client.put = function (url, data, callback, access_token) {
        access_token = access_token || this.access_token;
        this.oauth2.put(url, access_token, data, callback);
    }

    Client.getOAuthAccessToken('', {'grant_type': 'client_credentials'});
};