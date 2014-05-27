/**
 * Requierements
 */
var Osf = require('osf'),
    mongoose = require('mongoose'),
    Schema = mongoose.Schema;

/**
 * Object.
 */
var Account = {
    schema: new Schema({
        primary: {
            type: Number,
            default: 0,
            min : 0,
            max : 1
        },
        email: {
            type: String,
            trim: true,
            unique: true,
            required: true,
            set: Osf.string.lowercase
        },
        username: {
            type: String
        },
        domain: {
            type: String
        },
        activation: {
            key : String,
            value : {
                type: Number,
                default: 0,
                min : 0,
                max : 1
            }
        },
        invited: {
            type: Number,
            default: 0,
            min : 0,
            max : 1
        },
        added: {
            type: Date
        },
        created: {
            type: Date
        },
        updated: {
            type: Date
        }
    }, {
        collection: 'accounts',
        versionKey : false
    })
};

/**
 * Auto update created and updated Dates
 */
Account.schema.pre('save', function(next){
    this.updated = new Date();
    if(!this.created){
        this.created = new Date();
    }

    if (0 < this.email.length) {
        var username = this.email.replace(/@.*/,"");
        if(this.email !== username){
            this.username =  username;
        }
    }

    if (0 < this.email.length) {
        var domain = this.email.replace(/.*@/,"");
        if(this.email !== domain){
            this.domain = domain;
        }
    }
    next();
});

/**
 * Export Model & Schema.
 */
mongoose.model('account', Account.schema);
exports.schema = Account.schema;