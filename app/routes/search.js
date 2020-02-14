const express = require('express');
const router = express.Router();
const searchSchemaByNamePart = require('../../utils/searchSchemaByNamePart');

router.get('/', (req, res) => {
	const search = decodeURIComponent(req.query.text);
	const results = searchSchemaByNamePart(search);
	
	res.json({
		results
	});
});

module.exports = router;
