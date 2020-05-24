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

passport.use(new SteamStrategy({
	returnURL: process.env.PRODUCTION == 'true' ? 'http://server.ip/auth/steam/return' : 'http://127.0.0.1:3000/auth/steam/return',
	realm: process.env.PRODUCTION == 'true' ? 'http://server.ip/' : 'http://127.0.0.1:3000/',
	apiKey: process.env.API_KEY
},
function(identifier, profile, done) {
	if (admins.indexOf(profile.id) > -1) {
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
		saveUninitialized: true }))
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

module.exports = app;

/**
 * Ensures that user is logged in
 * @param {Object} req 
 * @param {Object} res 
 * @param {Object} next 
 * @return {Object} next
 */
function ensureAuthenticated(req, res, next) {
	if (req.user) {
		return next();
	}
	res.redirect('/auth/steam');
}
