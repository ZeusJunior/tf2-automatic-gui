const express = require('express');
const router = express.Router();
const searchSchemaByNamePart = require('../../utils/searchSchemaByNamePart');

router.get('/', (req, res) => {
	const search = decodeURIComponent(req.query.text);
	let max = 10;
	if (typeof req.query.max != 'undefined') {
		max = req.query.max;
	}
	const results = searchSchemaByNamePart(search, max);
	
	res.json({
		results
	});
});

module.exports = router;
