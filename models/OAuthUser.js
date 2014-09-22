'use strict';

/**
 * Requirements
 */
var Osf = require("osf"),
    mongoose = require('mongoose'),
    Schema = mongoose.Schema;

/**
 * OAuth User Schema
 * @type {Schema}
 */
var OAuthUserSchema = new Schema({
    //Domain when the person registered
    provider: {
        type: String,
        trim: true,
        required: true,
        set: Osf.String.lowercase
    },

    // Unique Identifier of person.
    uid: {
        type: String
    },

    // Username of the person.
    username: {
        type: String,
        trim: true,
        set: Osf.String.ucfirst
    },

    // Password of the person.
    password: {
        type: String,
        required: true
    },

    // First name of the person.
    firstname: {
        type: String,
        trim: true,
        set: Osf.String.ucfirst
    },

    // First name of the person.
    lastname: {
        type: String,
        trim: true,
        set: Osf.String.ucfirst
    },

    // Birthday of the person.
    birthday: {
        type: Date
    },

    // Gender of the person.
    gender: {
        type: String,
        enum: ["male", "female", "undisclosed"],
        default: "undisclosed"
    },

    // Presentation of the person.
    aboutme: {
        type: String,
        trim: true,
        set: Osf.String.ucfirst
    },

    // Person is disabled.
    disabled: {
        type: Number,
        default: 0,
        min: 0,
        max: 1
    },

    object: {
        type: Schema.Types.ObjectId,
        ref: 'ActivityObject'
    },


    // Recovery key for change password.
    recovery: {
        type: String
    },

    // Accounts of the person.
    accounts: [
        {
            type: Schema.Types.ObjectId,
            ref: 'Account'
        }
    ],

    // Roles of the person.
    roles: [
        {
            type: String
        }
    ],

    token: {
        access: {
            type: String,
            min: 64,
            max: 64
        },
        refresh: {
            type: String,
            min: 64,
            max: 64
        },
        expire: {
            type: Date
        }
    },

    created: {
        type: Date
    },
    updated: {
        type: Date
    }
}, {
    collection: 'oauth.user',
    versionKey: false
});

/**
 * Auto update created and updated Dates
 */
OAuthUserSchema.pre('save', function (next) {
    this.updated = new Date();
    if (!this.created) {
        this.created = new Date();
    }
    if (this.roles instanceof Array && this.roles.length === 0) {
        this.roles.push("member");
    }

    if (!this.uid) {
        this.uid = this._id;
    }

    var user = this;
    if (!user.object) {
        var ActivityObject = mongoose.model('ActivityObject'),
            object = new ActivityObject({
                type: "Person",
                provider: this.provider,
                uid : this.uid,
                displayName: this.username,
                duplicates: Osf.String.sha512(this.provider + ":" + this.uid),
                published: this.created,
                updated: this.updated
            });
        object.save(function (err, object) {
            user.object = object;
            next(err, this);
        });
    } else {
        next(null, this);
    }
});

/**
 * Auto update created and updated Dates
 */
OAuthUserSchema.post('save', function (user) {
    if (user.object) {
        var ActivityObject = mongoose.model('ActivityObject');
        ActivityObject.findOne({
            "_id": user.object,
            content: {$exists: false}
        }, function (err, object) {
            if (err) {
                throw err;
            }
            if(object){
                object.content = user._id;
                object.save(function(err){
                    if (err) {
                        throw err;
                    }
                })
            }
        });
    }
});


/**
 * Auto delete associated accounts
 */
OAuthUserSchema.pre('remove', function (next) {
    var async = require("async"),
        AllowedClient = mongoose.model('OAuthAllowedClient'),
        Account = mongoose.model('Account'),
        person = this;
    async.
        auto({
            "accounts": function (callback) {
                Account.remove({
                    _id: {
                        "$in": person.accounts
                    }
                }, callback);
            },
            "allowedClients": function (callback) {
                AllowedClient.remove({ userId: person._id}, callback);
            }
        }, next);
});

OAuthUserSchema.options.toJSON = {
    transform: function (doc, ret, options) {
        ret.id = ret._id;
        delete ret.password;
        delete ret._id;
        delete ret.token;
        return ret;
    }
}

/**
 * Export Model & Schema.
 */
mongoose.model('OAuthUser', OAuthUserSchema);
mongoose.model('Person', OAuthUserSchema);
exports.schema = OAuthUserSchema;