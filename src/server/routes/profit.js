const express = require('express');
const router = express.Router();
const profit = require('../profit');
const fs = require('fs-extra');
const paths = require('../../../config/paths');
const path = require('path');

router.get('/', (req, res) => {
	if (req.query.json=='true') {
		if (!fs.existsSync(paths.files.polldata)) {
			res.json({
				success: 0
			});
			return;
		}

		profit.get(Number(req.query.start), Number(req.query.interval), Number(req.query.end))
			.then((data) => {
				res.json({
					success: 1,
					data
				});
			})
			.catch((err) => {
				throw err;
			});
	} else {
		res.sendFile(path.join(__dirname, '../../../dist/html/profit.html'));
	}
});

module.exports = router;
