const express = require('express');
const router = express.Router();
const pricelist = require('../pricelist');

router.post('/', (req, res) => {
	pricelist
		.clear()
		.then(() => {
			res.json({
				success: 1,
				msg: {
					type: 'success',
					message: 'Pricelist has been cleared'
				}
			});
		})
		.catch((err) => {
			throw err;
		});
});

module.exports = router;
