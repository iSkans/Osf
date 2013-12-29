/**
 * Requierements
 */
var mongoose = require('mongoose'),
    Schema = mongoose.Schema;

/**
 * Object.
 */
var Ressource = {
    schema : new Schema({
        path: {
            type: String,
            trim: true
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
        collection: 'acl-ressources'
    })
};

/**
 * Export Model & Schema.
 */
mongoose.model('acl-ressource', Ressource.schema);
exports.schema = Ressource.schema;