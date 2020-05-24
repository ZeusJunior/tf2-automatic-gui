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
	// Always return profile, dont want constant logins if not an admin
	profile.identifier = identifier;
	return done(null, profile);
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
	.use(passport.initialize())
	.use(passport.session())
	.use(express.static(__dirname + '/../../public'))
	// Ensure user is authenticated and an admin. Use it side wide
	.use((req, res, next) => {
		if (req.originalUrl.startsWith('/auth/steam')) { // Trying to log in, continue
			return next();
		}
		if (req.user) { // Is logged in
			if (admins.indexOf(req.user.id) > -1) { // Is an admin, continue
				return next();
			}
			
			return res.send('No');
		}
		res.redirect('/auth/steam');
	});

app
	.use('/', index)
	.use('/removeItems', removeItems)
	.use('/clearPricelist', clearPricelist)
	.use('/addItem', addItem)
	.use('/addItems', addItems)
	.use('/trades', trades)
	.use('/changeItem', changeItem)
	.use('/search', search)
	.use('/getItems', getItems)
	.use('/profit', profit)
	.use('/autoprice', autoprice)
	.use('/auth', authRoutes);
	
app.get('/logout', function(req, res) {
	req.logout();
	res.redirect('/');
});

module.exports = app;
