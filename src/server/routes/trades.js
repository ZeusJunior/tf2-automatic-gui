const express = require('express');
const router = express.Router();
const trades = require('../trades');
const fs = require('fs-extra');
const paths = require('../../../config/paths');
const path = require('path');

router.get('/', (req, res) => {
	if (req.query.json!='true') {
		if (!fs.existsSync(paths.files.polldata)) {
			res.sendFile(path.join(__dirname, '../../../dist/html/trades.html'));
			return;
		}
	
		trades.get()
			.then((data) => {
				res.sendFile(path.join(__dirname, '../../../dist/html/trades.html'));
			})
			.catch((err) => {
				throw err;
			});
	} else {
		if (!fs.existsSync(paths.files.polldata)) {
			res.json({
				success: 0
			});
			return;
		}
	
		trades.get(Number(req.query.first), Number(req.query.count), Number(req.query.dir)==1)
			.then((data) => {
				res.json({
					success: 1,
					data
				});
			})
			.catch((err) => {
				throw err;
			});
	}
});

module.exports = router;
