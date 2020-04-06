const express = require('express');
const router = express.Router();
const profit = require('../profit');
const fs = require('fs-extra');
const paths = require('../../resources/paths');

router.get('/', (req, res) => {
	if (!fs.existsSync(paths.files.polldata)) {
		res.json({
			success: 0
		});
		return;
	}

	profit.get(false, req.query.start, req.query.interval, req.query.end)
		.then((data) => {
			res.json({
				success: 1,
				data
			});
		})
		.catch((err) => {
			throw err;
		});
});

module.exports = router;