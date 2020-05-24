// Handles express side of things

const path = require('path');
const express = require('express');
const app = express();
const bodyParser = require('body-parser');
const passport = require('passport');
const session = require('express-session');
const SteamStrategy = require('passport-steam').Strategy;

// Maybe just require in the app.use instead of vars
const index = require('./routes/index');
const removeItems = require('./routes/removeItems');
const addItem = require('./routes/addItem');
const addItems = require('./routes/addItems');
const trades = require('./routes/trades');
const changeItem = require('./routes/changeItem');
const clearPricelist = require('./routes/clearPricelist');
const search = require('./routes/search');
const getItems = require('./routes/getItems');
const profit = require('./routes/profit');
const autoprice = require('./routes/autoprice');
const authRoutes = require('./routes/auth');

// Passport session setup.
//   To support persistent login sessions, Passport needs to be able to
//   serialize users into and deserialize users out of the session.  Typically,
//   this will be as simple as storing the user ID when serializing, and finding
//   the user by ID when deserializing.  However, since this example does not
//   have a database of user records, the complete Steam profile is serialized
//   and deserialized.
passport.serializeUser(function(user, done) {
	done(null, user);
});
  
passport.deserializeUser(function(obj, done) {
	done(null, obj);
});

const admins = [
	'76561198162885342',
	'76561198144346135'
];

// Use the SteamStrategy within Passport.
//   Strategies in passport require a `validate` function, which accept
//   credentials (in this case, an OpenID identifier and profile), and invoke a
//   callback with a user object.
passport.use(new SteamStrategy({
	returnURL: 'http://188.167.111.197:3000/auth/steam/return',
	realm: 'http://188.167.111.197:3000/',
	apiKey: '5DD9FFE10E50068BCA55D3C6E8176EBD'
},
function(identifier, profile, done) {
	if (admins.indexOf(profile.id) > -1) {
		// To keep the example simple, the user's Steam profile is returned to
		// represent the logged-in user.  In a typical application, you would want
		// to associate the Steam account with a user record in your database,
		// and return that user instead.
		profile.identifier = identifier;
		console.log(profile);
		return done(null, profile);
	} else {
		return done(null, null);
	}
}
));

app
	.use(express.static(path.join(__dirname, '../assets')))
	.set('views', path.join(__dirname, '../views'))
	.set('view engine', 'ejs')
	.use(bodyParser.json())
	.use(bodyParser.urlencoded({
		extended: false
	}))
	.use(session({
		secret: 'your secret',
		name: 'name of session id',
		resave: true,
		saveUninitialized: true}))
// Initialize Passport!  Also use passport.session() middleware, to support
// persistent login sessions (recommended).
	.use(passport.initialize())
	.use(passport.session())
	.use(express.static(__dirname + '/../../public'));

app
	.use('/', ensureAuthenticated, index)
	.use('/removeItems', ensureAuthenticated, removeItems)
	.use('/clearPricelist', ensureAuthenticated, clearPricelist)
	.use('/addItem', ensureAuthenticated, addItem)
	.use('/addItems', ensureAuthenticated, addItems)
	.use('/trades', ensureAuthenticated, trades)
	.use('/changeItem', ensureAuthenticated, changeItem)
	.use('/search', ensureAuthenticated, search)
	.use('/getItems', ensureAuthenticated, getItems)
	.use('/profit', ensureAuthenticated, profit)
	.use('/autoprice', ensureAuthenticated, autoprice)
	.use('/auth', authRoutes);
	
app.get('/logout', function(req, res) {
	req.logout();
	res.redirect('/');
});
/*
// GET /auth/steam
//   Use passport.authenticate() as route middleware to authenticate the
//   request.  The first step in Steam authentication will involve redirecting
//   the user to steamcommunity.com.  After authenticating, Steam will redirect the
//   user back to this application at /auth/steam/return
app.get('/auth/steam',
	passport.authenticate('steam', { failureRedirect: '/' }),
	function(req, res) {
		res.redirect('/');
	});
  
// GET /auth/steam/return
//   Use passport.authenticate() as route middleware to authenticate the
//   request.  If authentication fails, the user will be redirected back to the
//   login page.  Otherwise, the primary route function function will be called,
//   which, in this example, will redirect the user to the home page.
app.get('/auth/steam/return',
	passport.authenticate('steam', { failureRedirect: '/' }),
	function(req, res) {
		res.redirect('/');
	});
*/
module.exports = app;

/**
 * Ensures that user is logged in
 * @param {Object} req 
 * @param {Object} res 
 * @param {Object} next 
 * @return {Object} next
 */
function ensureAuthenticated(req, res, next) {
	if (req.isAuthenticated() || req.path.indexOf('/auth') == 0 || req.hostname === 'localhost' || req.hostname === '127.0.0.1' ) {
		return next();
	}
	res.redirect('/auth/steam');
}
