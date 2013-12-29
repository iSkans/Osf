/**
 * Requierements
 */
var mongoose = require('mongoose'),
    Schema = mongoose.Schema;

/**
 * Object.
 */
var Account = {
    schema: new Schema({
        primary: {
            type: Boolean
        },
        email: {
            type: String,
            trim: true
        },
        activated: {
            type: String
        },
        invited: {
            type: Boolean
        },
        added: {
            type: Date
        },
        updated: {
            type: Date
        }
    }, {
        collection: 'accounts'
    })  ,
    virtual: {
        username : function () {
            if (0 < this.email.length) {
                var username = this.email.replace(/@.*/,"");
                if(this.email === username){
                    return;
                }
                return username;
            }
            return;
        },
        domain : function () {
            if (0 < this.email.length) {
                var domain = this.email.replace(/.*@/,"");
                if(this.email === domain){
                    return;
                }
                return domain;
            }
            return;
        }
    }
};

/**
 * Export Model & Schema.
 */
mongoose.model('accounts', Account.schema);
exports.schema = Account.schema;