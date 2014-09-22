'use strict';

/**
 * Requirements
 */
var Osf = require("osf"),
    mongoose = require('mongoose'),
    Schema = mongoose.Schema,
    STATUS = {
        active: "active",
        canceled: "canceled",
        completed: "completed",
        pending: "pending",
        tentative: "tentative",
        voided: "voided"
    },
    VERB = {
        post: "post",
        comment: "comment"
    };

/**
 * Activity Schema
 * @type {Schema}
 */
var ActivitySchema = new Schema({
    // Actor.
    actor: {
        type: Schema.Types.ObjectId,
        ref: 'ActivityObject',
        required: true
    },
    // Object.
    object: {
        type: Schema.Types.ObjectId,
        ref: 'ActivityObject',
        required: true
    },
    // Participants.
    participants: [
        {
            type: Schema.Types.ObjectId,
            ref: 'ActivityObject'
        }
    ],
    // Priority
    /*
     Many existing systems do not represent priority values as numeric
     ranges.  Such systems might use fixed, labeled brackets such as
     "low", "normal" and "high" or "urgent".  Similar mechanisms can be
     established, by convention, when using the "priority" property.  In
     typical use, it is RECOMMENDED that implementations wishing to work
     with such defined categories treat "priority" property values in the
     range 0.00 to 0.25 as "low" priority; values greater than 0.25 to
     0.75 as "normal" priority; and values greater than 0.75 to 1.00 as
     "high" priority.  Specific implementations are free to establish
     alternative conventions for the grouping of priority values with the
     caveat that such conventions likely will not be understood by all
     implementations.
     */
    priority: {
        type: Number
    },

    // Provider.
    provider: {
        type: String
    },

    // Published date.
    published: {
        type: Date
    },

    // Result.
    result: {
        type: Schema.Types.ObjectId,
        ref: 'ActivityObject'
    },

    // Status.
    status: {
        type: String,
        enum: Object.keys(STATUS),
        default: STATUS.completed
    },

    // Target.
    target: {
        type: Schema.Types.ObjectId,
        ref: 'ActivityObject',
        required: true
    },
    updated: {
        type: Date
    },
    // Verb.
    verb: {
        type: String,
        enum: Object.keys(VERB),
        default: VERB.post,
        required: true
    },

    to: [
        {
            type: Schema.Types.ObjectId,
            ref: 'ActivityObject'
        }
    ],
    cc: [
        {
            type: Schema.Types.ObjectId,
            ref: 'ActivityObject'
        }
    ],
    bto: [
        {
            type: Schema.Types.ObjectId,
            ref: 'ActivityObject'
        }
    ],
    bcc: [
        {
            type: Schema.Types.ObjectId,
            ref: 'ActivityObject'
        }
    ]
}, {
    collection: 'osf.activity',
    versionKey: false
});

/**
 * Status list
 * "active" indicates that the activity is ongoing;
 * "canceled" indicates that the activity has been aborted;
 * "completed" indicates that the activity concluded;
 * "pending" indicates that the activity is expected to begin;
 * "tentative" indicates that the activity has been proposed;
 * "voided" indicates that the activity statement has been retracted or should be considered invalid.
 */
ActivitySchema.statics.Status = STATUS;

ActivitySchema.statics.Verb = VERB;

ActivitySchema.options.toJSON = {
    transform: function (doc, ret, options) {
        ret.id = ret._id;
        delete ret._id;
        delete ret.bcc;
        delete ret.bto;
        delete ret.cc;
        delete ret.to;
        delete ret.participants;
        delete ret.status;
        delete ret.verb;
        return ret;
    }
};

/**
 * Auto update published and updated Dates
 */
ActivitySchema.pre('save', function (next) {
    this.updated = new Date();
    if (!this.published) {
        this.published = new Date();
    }
    next(null, this);
});

/**
 * Auto delete activity object
 */
ActivitySchema.post('remove', function () {
    var activity = this;
    if (activity.verb === VERB.post) {
        var async = require("async"),
            ActivityObject = mongoose.model('ActivityObject');
        async.auto({
            "object": function (callback) {
                ActivityObject.
                    findOne({
                        "_id": activity.object.id,
                        "type": {$in: ["Article"]}
                    }).
                    exec(function (err, exist) {
                        if (err) {
                            return callback(err);
                        }
                        if (exist) {
                            exist.remove(callback);
                        } else {
                            return callback();
                        }
                    });
            }
        }, function (err, results) {
            if (err) {
                throw err;
            }
        });
    }
});

/**
 * Export Model & Schema.
 */
mongoose.model('Activity', ActivitySchema);
exports.schema = ActivitySchema;