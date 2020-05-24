const express = require('express');
const router = express.Router();
const pricelist = require('../pricelist');
const getPluralOrSingularString = require('../../utils/getPluralOrSingularString');

router.post('/', (req, res) => {
	const input = req.body.input.split(/\r?\n/);

	if (req.body.max - req.body.min < 0) {
		res.json({
			success: 0,
			msg: {
				type: 'warning',
				message: 'Maximum stock can\'t be smaller than the minimum'
			}
		});
		return;
	}

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

	if (!req.body.autoprice) {
		sellvalues = {
			keys: Number(req.body.sell_keys),
			metal: Number(req.body.sell_metal)
		};

		buyvalues = {
			keys: Number(req.body.buy_keys),
			metal: Number(req.body.buy_metal)
		};
	
		// lower sell keys
		if (sellvalues.keys < buyvalues.keys && req.body.intent != 0) {
			res.json({
				success: 0,
				msg: {
					type: 'warning',
					message: 'The sell price must be higher than the buy price'
				}
			});
			return;
		}
		// Same amount of keys, lower or equal sell metal
		if (sellvalues.keys === buyvalues.keys && sellvalues.metal <= buyvalues.metal && req.body.intent != 0) {
			res.json({
				success: 0,
				msg: {
					type: 'warning',
					message: 'The sell price must be higher than the buy price'
				}
			});
			return;
		}
	}
	pricelist
		.addItems(input, {
			intent: parseInt(req.body.intent),
			min: parseInt(req.body.min),
			max: parseInt(req.body.max),
			autoprice: req.body.autoprice,
			buy: {
				keys: Number(req.body.buy_keys),
				metal: Number(req.body.buy_metal)
			},
			sell: {
				keys: Number(req.body.sell_keys),
				metal: Number(req.body.sell_metal)
			}
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
