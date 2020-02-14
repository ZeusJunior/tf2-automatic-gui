const express = require('express');
const router = express.Router();
const trades = require('../trades');
const fs = require('fs-extra');
const paths = require('../../resources/paths');

router.get('/', (req, res) => {
	if (!fs.existsSync(paths.files.polldata)) {
		res.render('trades', {
			data: null,
			polldata: false
		});
		return;
	}

	trades.get()
		.then((data) => {
			res.render('trades', {
				data: data,
				polldata: true
			});
		})
		.catch((err) => {
			throw err;
		});
});

module.exports = router;
