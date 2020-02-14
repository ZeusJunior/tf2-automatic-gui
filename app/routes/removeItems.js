const express = require('express');
// eslint-disable-next-line new-cap
const router = express.Router();
const pricelist = require('../pricelist');

router.post('/', async (req, res) => {
	const items = req.body.list;
	
	pricelist
		.removeItems(items)
		.then((removed) => {
			const amountRemoved = removed === false ? 0 : removed;

			res.json({
				removed: amountRemoved
			});
		})	.catch((err) => {
			throw err;
		});
});

module.exports = router;
