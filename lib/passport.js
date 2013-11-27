/**
 * Requirements
 */
var passport = require('passport'),
	LocalStrategy = require('passport-local').Strategy,
	TwitterStrategy = require('passport-twitter').Strategy,
	FacebookStrategy = require('passport-facebook').Strategy,
	GoogleStrategy = require('passport-google-oauth').Strategy,
	mongoose = require('mongoose');
    Osf = require(__dirname+'/string');

var $class = {};

$class.init = function(config) {
	var Person = mongoose.model('person');

	//-- Serialize sessions --//
	passport.serializeUser(function(person, done) {
		done(null, person._id);
	});

	//-- Unserialize sessions --//
	passport.deserializeUser(function(id, done) {
		Person.findOne({
			"_id": id
		}, function(err, person) {
			done(err, person);
		});
	});

	//-- Local passport --//
	passport.use(new LocalStrategy({
		usernameField: 'email',
		passwordField: 'password'
	}, function(email, password, next) {
		Person.findOne({
			email: Osf.string.toLowerCase(email)
		}, function(err, person) {
			if (err) {
				return next(err);
			}
			if (!person) {
				return next(null, false, {
					email: "email"
				});
			}

			if (person.password !== Osf.string.sha512(password, config.salt)) {
				return next(null, false, {
					password: 'invalid'
				});
			}

			if (typeof(person.activated) !== 'undefined') {
				return next(null, false, {
					email: "activated"
				});
			}
			return next(null, person);
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