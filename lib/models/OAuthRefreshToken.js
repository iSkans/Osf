'use strict';

/**
 * Requirements
 */
var mongoose = require('mongoose'),
    Schema = mongoose.Schema;

/**
 * OAuth RefreshToken Schema
 * @type {Schema}
 */
var OAuthRefreshTokenSchema = new Schema({
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
    collection: 'oauth.token.refresh',
    versionKey : false
});

OAuthRefreshTokenSchema.options.toJSON = {
    transform : function(doc, ret, options){
        ret.id = ret._id;
        delete ret._id;
        return ret;
    }
}

/**
 * Export Model & Schema.
 */
mongoose.model('OAuthRefreshToken', OAuthRefreshTokenSchema);
exports.schema = OAuthRefreshTokenSchema;