/**
 * Requierements
 */
var Osf = require('osf'),
    mongoose = require('mongoose'),
    Schema = mongoose.Schema;

/**
 * Object.
 */
var Role = {
    schema: new Schema({
        type: {
            type: String,
            enum: ["system", "user"]
        },
        name: {
            type: String,
            trim: true,
            unique: true,
            set: Osf.string.lowercase
        },
        description: {
            type: String,
            trim: true,
            set: Osf.string.ucfirst
        },
        resources: [
            {
                type: Schema.Types.ObjectId,
                ref: 'acl-resource'
            }
        ]
    }, {
        collection: 'acl-roles',
        versionKey : false
    })
};

Role.schema.index({type: 1});

/**
 * Export Model & Schema.
 */
mongoose.model('acl-role', Role.schema);
exports.schema = Role.schema;