const express = require('express');
const router = express.Router();
const Currency = require('tf2-currencies');
const pricelist = require('../pricelist');
const renderPricelist = require('../../utils/renderPricelist');

router.post('/', (req, res) => {
	const { sku, intent, autoprice, min, max, sellkeys, sellmetal, buykeys, buymetal } = req.body;

	if (parseInt(max) <= parseInt(min)) {
		renderPricelist({ res, type: 'warning', message: 'The maximum stock must be atleast one higher than the minimum' });
		return;
	}

	const sellvalues = new Currency({keys: sellkeys, metal: sellmetal.replace(',', '.')}).toJSON();
	const buyvalues = new Currency({keys: buykeys, metal: buymetal.replace(',', '.')}).toJSON();

	// lower sell keys
	if (sellvalues.keys < buyvalues.keys) {
		renderPricelist({ res, type: 'warning', message: 'The sell price must be higher than the buy price' });
		return;
	}
	// Same amount of keys, lower or equal sell metal
	if (sellvalues.keys === buyvalues.keys && sellvalues.metal <= buyvalues.metal) {
		renderPricelist({ res, type: 'warning', message: 'The sell price must be higher than the buy price' });
		return;
	}

	const item = {
		sku: sku,
		sell: sellvalues,
		buy: buyvalues,
		intent: parseInt(intent),
		min: parseInt(min),
		max: parseInt(max),
		autoprice: autoprice == true
	};

	item.time = item.autoprice ? parseInt(new Date().getTime() / 1000) : 0;
	
	pricelist
		.changeSingleItem(item)
		.then(() => renderPricelist({ res, type: 'success', message: item.sku + ' has been changed' }))
		.catch((err) => {
			throw err;
		});
});

module.exports = router;
