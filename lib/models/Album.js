'use strict';

/**
 * Requirements
 */
var Osf = require("osf"),
    mongoose = require('mongoose'),
    Schema = mongoose.Schema;

/**
 * Address Schema
 * @type {Schema}
 */
var AlbumSchema = new Schema({
    description : {
        type : String
    },
    location: {
        type: Schema.Types.ObjectId,
        ref: 'Address'
    },
    mediaLinks : [{
        type: Schema.Types.ObjectId,
        ref: 'MediaLink'
    }],
    owner : {
        type: Schema.Types.ObjectId,
        ref: 'Person'
    },
    thumbnail : {
        type: Schema.Types.ObjectId,
        ref: 'MediaLink'
    },
    title : {
        type : String
    }
}, {
    collection: 'osf.album',
    versionKey: false
});

AlbumSchema.options.toJSON = {
    transform: function (doc, ret, options) {
        ret.objectType = ret.type;
        ret.id = ret._id;
        delete ret._id;
        return ret;
    }
}

/**
 * Export Model & Schema.
 */
mongoose.model('Album', AlbumSchema);
exports.schema = AlbumSchema;