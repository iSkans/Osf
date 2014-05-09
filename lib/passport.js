/**
 * Requirements
 */
var passport = require('passport'),
	LocalStrategy = require('passport-local').Strategy,
	TwitterStrategy = require('passport-twitter').Strategy,
	FacebookStrategy = require('passport-facebook').Strategy,
	GoogleStrategy = require('passport-google-oauth').Strategy,
	mongoose = require('mongoose'),
    _ = require('underscore'),
    Osf = {}
    _.extend(Osf, require(__dirname + '/string'), require(__dirname + '/error'));

var $class = {};

$class.init = function(config) {
	var Person = mongoose.model('person');

	//-- Serialize sessions --//
	passport.serializeUser(function(person, done) {
		done(null, person._id);
	});

	//-- Unserialize sessions --//
	passport.deserializeUser(function(id, next) {
		Person.
        findOne({
            "_id": id
        }).
        populate({
            path: "roles",
            select: "name type"
        }).
        exec(function(err, person) {
            if(err){
                return next(Osf.error.msg(err,"500"));
            }
            next(null, person);
		});
	});

	//-- Local passport --//
	passport.use(new LocalStrategy({
		usernameField: 'email',
		passwordField: 'password'
	}, function(email, password, next) {
        Person.
        find({
            password : Osf.string.sha512(password, config.crypto.salt),
            disabled : 0
        }).
        populate({
            path: "accounts",
            match: {
                email: Osf.string.lowercase(email),
                invited: 1
            },
            select: "email username domain activation"
        }).
        exec(function (err, persons) {
            if (err) {
                return next(err);
            }
            if (persons.length === 0) {
                return next(Osf.error.msg({password:"invalid"}, "500"));
            }

            var idx, person;
            for(idx = 0; idx < persons.length; idx++){
                person = persons[idx];
                if(0 < person.accounts.length){
                    if(person.accounts[0].activation.value){
                        return next(null, person);
                    } else {
                        return next(Osf.error.msg({email:"activated"}, "500"));
                    }
                }
            }
            return next(Osf.error.msg({email:"email"}, "500"));
        });
	}));

	//-- Twitter passport --//
	passport.use(new TwitterStrategy({
		consumerKey: config.twitter.clientID,
		consumerSecret: config.twitter.clientSecret,
		callbackURL: config.twitter.callbackURL
	}, function(token, tokenSecret, profile, done) {
		Person.findOne({
			'twitter.id_str': profile.id
		}, function(err, user) {
			if (err) {
				return done(err);
			}
			if (!user) {
				user = new User({
					name: profile.displayName,
					username: profile.username,
					provider: 'twitter',
					twitter: profile._json
				});
				user.save(function(err) {
					if (err) console.log(err);
					return done(err, user);
				});
			} else {
				return done(err, user);
			}
		});
	}));

	//-- Facebook passport --//
	passport.use(new FacebookStrategy({
		clientID: config.facebook.clientID,
		clientSecret: config.facebook.clientSecret,
		callbackURL: config.facebook.callbackURL
	}, function(accessToken, refreshToken, profile, done) {
		Person.findOne({
			'facebook.id': profile.id
		}, function(err, user) {
			if (err) {
				return done(err);
			}
			if (!user) {
				user = new User({
					name: profile.displayName,
					email: profile.emails[0].value,
					username: profile.username,
					provider: 'facebook',
					facebook: profile._json
				});
				user.save(function(err) {
					if (err) console.log(err);
					return done(err, user);
				});
			} else {
				return done(err, user);
			}
		});
	}));

	//Use google strategy
	passport.use(new GoogleStrategy({
		consumerKey: config.google.clientID,
		consumerSecret: config.google.clientSecret,
		callbackURL: config.google.callbackURL
	}, function(accessToken, refreshToken, profile, done) {
		Person.findOne({
			'google.id': profile.id
		}, function(err, user) {
			if (!user) {
				user = new User({
					name: profile.displayName,
					email: profile.emails[0].value,
					username: profile.username,
					provider: 'google',
					google: profile._json
				});
				user.save(function(err) {
					if (err) console.log(err);
					return done(err, user);
				});
			} else {
				return done(err, user);
			}
		});
	}));
	return passport;
};

//-- Export Class --//
if (typeof exports !== 'undefined') {
	if (typeof module !== 'undefined' && module.exports) {
		module.exports.passport = $class;
	}
	exports.passport = $class;
}