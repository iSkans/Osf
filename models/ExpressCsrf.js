'use strict';

/**
 * Requirements
 */
var mongoose = require('mongoose'),
    Schema = mongoose.Schema;

/**
 * Express Csrf Schema
 * @type {Schema}
 */
var ExpressCsrfSchema = new Schema({
    // Session identifier
    sessionId: {
        type: String,
        required: true
    },

    // Route url
    route: {
        type: String,
        required: true
    },

    // Csrf value
    value: {
        type: String,
        required: true
    },

    // Expire value
    expire: {
        type: Date,
        required: true
    }
}, {
    collection: 'express.csrf',
    versionKey : false
});

/**
 * Export Model & Schema.
 */
mongoose.model('ExpressCsrf', ExpressCsrfSchema);
exports.schema = ExpressCsrfSchema;