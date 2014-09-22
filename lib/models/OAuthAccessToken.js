'use strict';

/**
 * Requirements
 */
var mongoose = require('mongoose'),
    Schema = mongoose.Schema;

/**
 * OAuth AccessToken Schema
 * @type {Schema}
 */
var OAuthAccessTokenSchema = new Schema({
    user: {
        type: Schema.Types.ObjectId,
        ref: 'OAuthUser'
    },
    clientId: {
        type: String,
        min : 64,
        max : 64,
        required: true
    },
    value: {
        type: String,
        min : 64,
        max : 64,
        required: true
    },
    expires: {
        type: Date
    }
}, {
    collection: 'oauth.token.access',
    versionKey : false
});

OAuthAccessTokenSchema.options.toJSON = {
    transform : function(doc, ret, options){
        ret.id = ret._id;
        delete ret._id;
        return ret;
    }
}

/**
 * Export Model & Schema.
 */
mongoose.model('OAuthAccessToken', OAuthAccessTokenSchema);
exports.schema = OAuthAccessTokenSchema;