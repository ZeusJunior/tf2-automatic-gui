const express = require('express');
const router = express.Router();
const passport = require('passport');

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
