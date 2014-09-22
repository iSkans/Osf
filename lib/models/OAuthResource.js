'use strict';

/**
 * Requirements
 */
var Osf = require("osf"),
    mongoose = require('mongoose'),
    Schema = mongoose.Schema;

/**
 * Object.
 */
var OAuthResourceSchema = new Schema({
    provider: {
        type: String,
        trim: true,
        required: true
    },
    route: {
        type: String,
        trim: true,
        required: true
    },
    regex: {
        type: String,
        trim: true,
        required: true
    },
    type: {
        type: String,
        required: true,
        enum: ["all", "delete", "get", "post", "put" ],
        default: "get"
    },
    templateUrl: {
        type: String,
        trim: true
    },
    disableCache: {
        type: Boolean,
        trim: true
    },
    controller: {
        type: String,
        trim: true
    }
}, {
    collection: 'oauth.resource',
    versionKey: false
});

OAuthResourceSchema.index({provider: 1, route: 1, type: 1});

OAuthResourceSchema.options.toJSON = {
    transform : function(doc, ret, options){
        delete ret._id;
        delete ret.provider;
        delete ret.regex;
        return ret;
    }
}

/**
 * Export Model & Schema.
 */
mongoose.model('OAuthResource', OAuthResourceSchema);
exports.schema = OAuthResourceSchema;