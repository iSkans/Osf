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
            type: Number,
            default: 0,
            min : 0,
            max : 1
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
        ],
        created: {
            type: Date
        },
        updated: {
            type: Date
        }
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
 * Auto update created and updated Dates
 */
Person.schema.pre('save', function(next){
    this.updated = new Date();
    if(!this.created){
        this.created = new Date();
    }
    next();
});

/**
 * Auto delete associated accounts
 */
Person.schema.pre('remove', function(next) {
    var Account = mongoose.model('account');
    Account.remove({
        _id: {
            "$in": this.accounts
        }
    },function(err, removedAccounts) {
        if (err) {
            return next(Osf.error.msg(err));
        }
        return next(null,removedAccounts);
    });
});


/**
 * Export Model & Schema.
 */
mongoose.model('person', Person.schema);
exports.schema = Person.schema;