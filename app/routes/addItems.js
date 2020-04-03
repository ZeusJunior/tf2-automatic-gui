const express = require('express');
const router = express.Router();
const pricelist = require('../pricelist');
const getPluralOrSingularString = require('../../utils/getPluralOrSingularString');

router.post('/', (req, res) => {
	const input = req.body.input.split(/\r?\n/);

	if (req.body.max - req.body.min < 1) {
		res.json({
			success: 0,
			msg: {
				type: 'warning',
				message: 'The maximum stock must be atleast one higher than the minimum'
			}
		});
		return;
	}

	input.forEach(function(item) {
		if (item.includes('classifieds')) {
			res.json({
				success: 0,
				msg: {
					type: 'danger',
					message: 'Please use the items stats page or full name, not the classifieds link'
				}
			});
			return;
		}
	});

	pricelist
		.addItems(input, {
			intent: parseInt(req.body.intent),
			min: parseInt(req.body.min),
			max: parseInt(req.body.max)
		})
		.then(({ itemsAdded, failedItems, itemsFailed, alreadyAdded }) => {
			let message = `${itemsAdded} item${getPluralOrSingularString(itemsAdded)} added,
							${itemsFailed} item${getPluralOrSingularString(itemsFailed)} failed${(alreadyAdded > 0 ? `, ${alreadyAdded} ${alreadyAdded == 1 ? ' item was' : ' items were'} already in your pricelist` : '')}.`;
			failedItems.forEach((e) => {
				message+=`${e} failed.`;
			});
			res.json({
				success: 1,
				msg: {
					type: 'info',
					message
				}
			});
		})
		.catch((err) => {
			throw err;
		});
});

module.exports = router;
