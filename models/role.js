/**
 * Requierements
 */
var mongoose = require('mongoose'),
    Schema = mongoose.Schema;

/**
 * Object.
 */
var Role = {
    schema : new Schema({
        name: {
            type: String,
            trim: true
        },
        description: {
            type: String,
            trim: true
        },
        type: {
            type: String,
            enum: ["system","user"]
        }
    }, {
        collection: 'acl-roles'
    })
};

/**
 * Export Model & Schema.
 */
mongoose.model('acl-role', Role.schema);
exports.schema = Role.schema;