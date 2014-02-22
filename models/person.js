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
        //Domain when the person registered
        domain: {
            type: String,
            trim: true,
            set: Osf.string.lowercase
        },

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

Person.schema.virtual('isAdmin').get(function () {
    var idx = 0;
    for(idx; idx < this.roles.length; idx++){
        if (this.roles[idx] instanceof Object &&
            typeof(this.roles[idx].name) !== "undefined" &&
            typeof(this.roles[idx].type) !== "undefined" &&
            this.roles[idx].name === "administrator" &&
            this.roles[idx].type === "system") {
            return true;
        }
    }
    return false;
});

/**
 * Export Model & Schema.
 */
mongoose.model('person', Person.schema);
exports.schema = Person.schema;