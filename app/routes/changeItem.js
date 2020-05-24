const express = require('express');
const router = express.Router();
const Currency = require('tf2-currencies');
const pricelist = require('../pricelist');

router.post('/', (req, res) => {
	const { sku, intent, autoprice, min, max, sellkeys, sellmetal, buykeys, buymetal, enabled } = req.body;
	if (parseInt(max) < parseInt(min)) {
		res.json({
			success: 0,
			msg: {
				type: 'warning',
				message: 'Maximum stock can\'t be smaller than the minimum'
			}
		});
		return;
	}

	const sellvalues = new Currency({
		keys: sellkeys,
		metal: sellmetal
	}).toJSON();

	const buyvalues = new Currency({
		keys: buykeys,
		metal: buymetal
	}).toJSON();

	// lower sell keys
	if (!autoprice) {
		if (sellvalues.keys < buyvalues.keys) {
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
		if (sellvalues.keys === buyvalues.keys && sellvalues.metal <= buyvalues.metal) {
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

	const item = {
		sku: sku,
		sell: sellvalues,
		buy: buyvalues,
		intent: parseInt(intent),
		min: parseInt(min),
		max: parseInt(max),
		autoprice: autoprice,
		enabled: enabled
	};

	item.time = item.autoprice ? parseInt(new Date().getTime() / 1000) : 0;
	
	pricelist
		.changeSingleItem(item)
		.then(() => res.json({
			success: 1,
			msg: {
				type: 'success',
				message: item.sku + ' has been changed successfully'
			}
		}))
		.catch((err) => {
			throw err;
		});
});

module.exports = router;
