'use strict';

/**
 * Requirements
 */
var Osf = require("osf"),
    mongoose = require('mongoose'),
    Schema = mongoose.Schema,
    RegexAllPunct = /[ -/:-@[-\]_{-~\u00a0-§©«-¬®°-±¶-·»¿×÷;·϶҂՚-՟։-֊־׀׃׆׳-״؆-؏؛؞-؟٪-٭۔۩۽-۾܀-܍߶-߹।-॥॰৲-৳৺૱୰௳-௺౿ೱ-ೲ൹෴฿๏๚-๛༁-༗༚-༟༴༶༸༺-༽྅྾-࿅࿇-࿌࿎-࿔၊-၏႞-႟჻፠-፨᎐-᎙᙭-᙮\u1680᚛-᚜᛫-᛭᜵-᜶។-៖៘-៛᠀-᠊\u180e᥀᥄-᥅᧞-᧿᨞-᨟᭚-᭪᭴-᭼᰻-᰿᱾-᱿\u2000-\u200a‐-\u2029\u202f-\u205f⁺-⁾₊-₎₠-₵℀-℁℃-℆℈-℉℔№-℘℞-℣℥℧℩℮℺-℻⅀-⅄⅊-⅍⅏←-⏧␀-␦⑀-⑊⒜-ⓩ─-⚝⚠-⚼⛀-⛃✁-✄✆-✉✌-✧✩-❋❍❏-❒❖❘-❞❡-❵➔➘-➯➱-➾⟀-⟊⟌⟐-⭌⭐-⭔⳥-⳪⳹-⳼⳾-⳿⸀-⸮⸰⺀-⺙⺛-⻳⼀-⿕⿰-⿻\u3000-〄〈-〠〰〶-〷〽-〿゠・㆐-㆑㆖-㆟㇀-㇣㈀-㈞㈪-㉃㉐㉠-㉿㊊-㊰㋀-㋾㌀-㏿䷀-䷿꒐-꓆꘍-꘏꙳꙾꠨-꠫꡴-꡷꣎-꣏꤮-꤯꥟꩜-꩟﬩﴾-﴿﷼-﷽︐-︙︰-﹒﹔-﹦﹨-﹫！-／：-＠［-］＿｛-･￠-￢￤-￦￨-￮￼-�]|\ud800[\udd00-\udd02\udd37-\udd3f\udd79-\udd89\udd90-\udd9b\uddd0-\uddfc\udf9f\udfd0]|\ud802[\udd1f\udd3f\ude50-\ude58]|\ud809[\udc70-\udc73]|\ud834[\udc00-\udcf5\udd00-\udd26\udd29-\udd64\udd6a-\udd6c\udd83-\udd84\udd8c-\udda9\uddae-\udddd\ude00-\ude41\ude45\udf00-\udf56]|\ud835[\udec1\udedb\udefb\udf15\udf35\udf4f\udf6f\udf89\udfa9\udfc3]|\ud83c[\udc00-\udc2b\udc30-\udc93]/g,
    TYPES = {
        Book: "Book",
        Person: "Person",
        Article: "Article",
        Note: "Note"
    };

/**
 * ActivityObject Schema
 * @type {Schema}
 */
var ActivityObjectSchema = new Schema({
    attachments: [
        {
            type: Schema.Types.ObjectId,
            ref: 'ActivityObject'
        }
    ],

    author: {
        type: Schema.Types.ObjectId,
        ref: 'ActivityObject'
    },

    content: {
        type: Schema.Types.Mixed
    },

    displayName: {
        type: String
    },

    duplicates: {
        type: String
    },

    image: {
        type: Schema.Types.ObjectId,
        ref: 'MediaLink'
    },

    language: {
        type: String
    },

    location: {
        type: Schema.Types.ObjectId,
        ref: 'Address'
    },

    published: {
        type: Date
    },

    provider: {
        type: String
    },

    rating: {
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

    summary: {
        type: String
    },

    tags: [
        {
            type: String
        }
    ],

    type: {
        type: String,
        enum: Object.keys(TYPES),
        default: TYPES.Note,
        required: true
    },

    updated: {
        type: Date
    },

    // Unique Identifier.
    uid: {
        type: String
    },

    url: {
        type: String
    }
}, {
    collection: 'osf.activity.object',
    versionKey: false
});

ActivityObjectSchema.statics.Types = TYPES;

ActivityObjectSchema.options.toJSON = {
    transform: function (doc, ret, options) {
        ret.id = ret._id;
        delete ret._id;
        return ret;
    }
};

/**
 * Auto update created and updated Dates
 */
ActivityObjectSchema.pre('save', function (next) {
    this.updated = new Date();
    if (!this.published) {
        this.published = new Date();
    }

    if (!this.uid) {
        this.uid = this._id;
    }

    if (this.type && this.displayName) {
        this.url = "/" + this.type.toLowerCase() + "/view/" + this._id + "/" + this.displayName.
            replace(RegexAllPunct, "+").
            replace(/[+]{2,}/g, "+").
            replace(/^\+/g, '').
            replace(/\+$/g, '');
    }
    next(null, this);
});

/**
 * Auto populate content
 */
ActivityObjectSchema.post('save', function (object) {
    if (object.content) {
        if (object.type === TYPES.Book) {
            var Book = mongoose.model('Book');
            Book.
                findOne({
                    "_id": object.content
                }).
                exec(function (err, book) {
                    if (err) {
                        throw(err);
                    }
                    if (book) {
                        book.set({
                            updated: object.updated
                        });
                        book.save(function (err) {
                            if (err) {
                                throw(err);
                            }
                        });
                    }
                });
        } else if (object.type === TYPES.Person) {
            var Person = mongoose.model('Person');
            Person.
                findOne({
                    "_id": object.content
                }).
                exec(function (err, person) {
                    if (err) {
                        throw(err);
                    }
                    if (person) {
                        person.set({
                            updated: object.updated
                        });
                        person.save(function (err) {
                            if (err) {
                                throw(err);
                            }
                        });
                    }
                });
        }
    }
});


/**
 * Export Model & Schema.
 */
mongoose.model('ActivityObject', ActivityObjectSchema);
exports.schema = ActivityObjectSchema;