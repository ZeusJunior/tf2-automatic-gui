const express = require('express');
const router = express.Router();
const searchSchemaByNamePart = require('../../utils/searchSchemaByNamePart');

router.get('/', (req, res) => {
	const search = decodeURIComponent(req.query.text);
	const results = searchSchemaByNamePart(search);
	
	res.json({
		results: results.slice(0, 5) // no need to return more than used
	});
});

module.exports = router;
