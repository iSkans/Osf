'use strict';

/**
 * Requirements
 */
var Osf = require("osf"),
    mongoose = require('mongoose'),
    Schema = mongoose.Schema;

/**
 * Address Schema
 * @type {Schema}
 */
var AddressSchema = new Schema({
    building: {
        type: String
    },
    country: {
        type: String
    },
    floor: {
        type: String
    },
    latitude: {
        type: String
    },
    locality: {
        type: String
    },
    longitude: {
        type: String
    },
    postalCode: {
        type: String
    },
    region: {
        type: String
    },
    street: {
        type: String
    },
    type: {
        type: String
    }
}, {
    collection: 'osf.address',
    versionKey: false
});

AddressSchema.options.toJSON = {
    transform: function (doc, ret, options) {
        ret.objectType = ret.type;
        ret.id = ret._id;
        delete ret._id;
        return ret;
    }
}

/**
 * Export Model & Schema.
 */
mongoose.model('Address', AddressSchema);
exports.schema = AddressSchema;