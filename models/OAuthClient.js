'use strict';

/**
 * Requirements
 */
var mongoose = require('mongoose'),
    Schema = mongoose.Schema;

/**
 * OAuth Client
 * @type {Schema}
 */
var OAuthClientSchema = new Schema({
    clientId: {
        type: String,
        min : 32,
        max : 32,
        required: true
    },
    clientSecret: {
        type: String,
        min : 32,
        max : 32,
        required: true
    },
    owner: {
        type: Schema.Types.ObjectId,
        ref: 'OAuthUser'
    },
    name: {
        type: String,
        min : 3,
        max : 100,
        required: true,
        unique: true,
        trim: true
    },
    description: {
        type: String,
        min : 20,
        max : 255,
        required: true,
        trim: true
    },
    url: {
        type: String,
        min : 15,
        max : 255,
        trim: true,
        unique: true,
        required: true
    },
    redirectUri: {
        type: String,
        min : 15,
        max : 255,
        trim: true
    },
    timeout: {
        type: Number,
        min : 0,
        max : 86400,
        default : 3600
    },
    autoApproved: {
        type: Number,
        default: 0,
        min : 0,
        max : 1
    },
    disabled: {
        type: Number,
        default: 0,
        min : 0,
        max : 1
    },
    created: {
        type: Date
    },
    updated: {
        type: Date
    }
}, {
    collection: 'oauth.client',
    versionKey : false
});

OAuthClientSchema.index({clientId: 1, clientSecret:1});

/**
 * Auto update created and updated Dates
 */
OAuthClientSchema.pre('save', function(next){
    this.updated = new Date();
    if(!this.created){
        this.created = new Date();
    }
    next();
});

OAuthClientSchema.options.toJSON = {
    transform : function(doc, ret, options){
        ret.id = ret._id;
        delete ret._id;
        return ret;
    }
}

/**
 * Export Model & Schema.
 */
mongoose.model('OAuthClient', OAuthClientSchema);
mongoose.model('Client', OAuthClientSchema);
exports.schema = OAuthClientSchema;