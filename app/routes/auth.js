const express = require('express');
const router = express.Router();
const passport = require('passport');

// GET /auth/steam and GET /auth/steam/return
router.get(/^\/auth\/steam(\/return)?$/, passport.authenticate('steam', {
	failureRedirect: '/'
}),
(req, res) => {
	res.redirect('/');
}
);

module.exports = router;
