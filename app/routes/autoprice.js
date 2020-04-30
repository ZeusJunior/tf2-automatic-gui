const express = require('express');
const router = express.Router();
const axios = require('axios');

router.get('/', (req, res) => {
	if (!req.query.sku || !isSKU(req.query.sku)) {
		res.json({
			success: false
		});
		return;
	}
	axios({
		method: 'get',
		url: `https://api.prices.tf/items/${req.query.sku}`,
		params: {
			src: 'bptf'
		},
		type: 'json'
	})
		.then((resp) => {
			res.json(resp.data);
		})
		.catch((err) => {
			res.json({
				success: false
			});
		});
});

module.exports = router;

/**
 * 
 * @param {String} str string to check
 * @return {Boolean} 
 */
function isSKU(str) {
	return str.split(';').length > 1 && Number.isInteger(Number(str.split(';')[0])) && Number.isInteger(Number(str.split(';')[1]));
}
