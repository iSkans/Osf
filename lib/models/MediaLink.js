'use strict';

/**
 * Requirements
 */
var Osf = require("osf"),
    mongoose = require('mongoose'),
    Schema = mongoose.Schema;

/**
 * MediaLink Schema
 * @type {Schema}
 */
var MediaLinkSchema = new Schema({
    album: {
        type: Schema.Types.ObjectId,
        ref: 'Album'
    },

    created: {
        type: Date
    },

    description: {
        type: String
    },

    duration: {
        type: Number
    },

    height: {
        type: Number
    },

    language: {
        type: String
    },

    location: {
        type: Schema.Types.ObjectId,
        ref: 'Address'
    },

    mimeType: {
        type: String
    },

    rating: {
        type: Number
    },

    size: {
        type: Number
    },

    stats: {
        views: {
            type: Number
        },
        comments: {
            type: Number
        },
        votes: {
            type: Number
        }
    },

    tags: [
        {
            type: String
        }
    ],

    thumbnail: {
        type: Schema.Types.ObjectId,
        ref: 'MediaLink'
    },

    title: {
        type: String
    },

    type: {
        type: String,
        enum: ['audio', 'image', 'video'],
        default: "image"

    },

    url: {
        type: String
    },

    width: {
        type: Number
    }
}, {
    collection: 'osf.media.link',
    versionKey: false
});

MediaLinkSchema.options.toJSON = {
    transform: function (doc, ret, options) {
        ret.id = ret._id;
        delete ret._id;
        return ret;
    }
}

/**
 * Export Model & Schema.
 */
mongoose.model('MediaLink', MediaLinkSchema);
exports.schema = MediaLinkSchema;