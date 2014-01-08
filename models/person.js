/**
 * Requierements
 */
var Osf = require('osf'),
    mongoose = require('mongoose'),
    Schema = mongoose.Schema;

/**
 * Object.
 */
var Person = {
    schema: new Schema({
        // Username of the person.
        username: {
            type: String,
            trim: true,
            set: Osf.string.ucfirst
        },

        // Password of the person.
        password: {
            type: String
        },

        // Accounts of the person.
        accounts: [
            {
                type: Schema.Types.ObjectId,
                ref: 'account'
            }
        ],

        // Person is disabled.
        disabled: {
            type: Boolean,
            default: false
        },

        // Recovery key for change password.
        recovery: {
            type: String
        },

        // Roles of the person
        roles: [
            {
                type: Schema.Types.ObjectId,
                ref: 'acl-role'
            }
        ]
    }, {
        collection: 'persons',
        versionKey: false
    })
};

/**
 * Export Model & Schema.
 */
mongoose.model('person', Person.schema);
exports.schema = Person.schema;