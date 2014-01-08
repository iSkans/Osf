/**
 * Requierements
 */
var mongoose = require('mongoose'),
    Schema = mongoose.Schema;

/**
 * Object.
 */
var Resource = {
    schema : new Schema({
        cache: {
            type: String,
            trim: true,
            unique : true
        },
        site: {
            type: String,
            trim: true
        },
        module: {
            type: String,
            trim: true
        },
        service: {
            type: String,
            trim: true
        },
        element: {
            type: String,
            trim: true
        }
    }, {
        collection: 'acl-resources',
        versionKey : false
    })
};

Resource.schema.index({site: 1});

/**
 * Export Model & Schema.
 */
mongoose.model('acl-resource', Resource.schema);
exports.schema = Resource.schema;