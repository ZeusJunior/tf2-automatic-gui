const express = require('express');
const router = express.Router();
const passport = require('passport');

// GET /auth/steam & GET /auth/steam/return
router.get(/^\/steam(\/return)?$/, (req, res, next) => {
	req.url = req.originalUrl;
	next();
},
passport.authenticate('steam', {
	failureRedirect: '/'
}),
(req, res) => {
	res.redirect('/');
});

module.exports = router;
