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
var OAuthAllowedClientSchema = new Schema({
    userId: {
        type: Schema.Types.ObjectId,
        ref: 'OAuthUser'
    },
    clientId: {
        type: String,
        min : 32,
        max : 32,
        required: true
    },
    allowed: {
        type: Number,
        default: 1,
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
    collection: 'oauth.client.allowed',
    versionKey : false
});

/**
 * Auto update created and updated Dates
 */
OAuthAllowedClientSchema.pre('save', function(next){
    this.updated = new Date();
    if(!this.created){
        this.created = new Date();
    }
    next();
});

OAuthAllowedClientSchema.options.toJSON = {
    transform : function(doc, ret, options){
        ret.id = ret._id;
        delete ret._id;
        return ret;
    }
}

/**
 * Export Model & Schema.
 */
mongoose.model('OAuthAllowedClient', OAuthAllowedClientSchema);
exports.schema = OAuthAllowedClientSchema;