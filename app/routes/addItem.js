const express = require('express');
const router = express.Router();
const Currency = require('tf2-currencies');
const pricelist = require('../pricelist');
const renderPricelist = require('../../utils/renderPricelist');

router.get('/', (req, res) => {
	const name = req.query.name ? decodeURIComponent(req.query.name) : '';
	res.render('addSingle', {
		name
	});
});

router.post('/', (req, res) => {
	const item = req.body.input;

	const { min, max, intent, sellmetal, sellkeys, buymetal, buykeys, autoprice } = req.body;
	const autopriced = autoprice == 'true' ? true : false;

	if (item.includes('classifieds')) {
		renderPricelist({ res, type: 'danger', message: 'Please use the items stats page or full name, not the classifieds link' });
		return;
	}

	if (max - min < 1) {
		renderPricelist({ res, type: 'warning', message: 'The maximum stock must be atleast one higher than the minimum' });
		return;
	}

	let sellvalues;
	let buyvalues;
	if (!autopriced) {
		sellvalues = new Currency({ keys: sellkeys, metal: sellmetal.replace(',', '.') }).toJSON();
		buyvalues = new Currency({ keys: buykeys, metal: buymetal.replace(',', '.') }).toJSON();
	
		// lower sell keys
		if (sellvalues.keys < buyvalues.keys) {
			renderPricelist({ res, type: 'warning', message: 'The sell price must be higher than the buy price'} );
			return;
		}
		// Same amount of keys, lower or equal sell metal
		if (sellvalues.keys === buyvalues.keys && sellvalues.metal <= buyvalues.metal) {
			renderPricelist({ res, type: 'warning', message: 'The sell price must be higher than the buy price' });
			return;
		}
	} else { // Autopriced, so dont use values
		sellvalues = {
			keys: 0,
			metal: 0
		};
		buyvalues = {
			keys: 0,
			metal: 0
		};
	}

	pricelist
		.addSingleItem(item, {
			intent: parseInt(intent),
			min: parseInt(min),
			max: parseInt(max),
			buy: buyvalues,
			sell: sellvalues,
			autoprice: autopriced
		})
		.then((result) => {
			const renderInfo = {
				res,
				type: 'success',
				message: 'Item was added successfully'
			};
			
			if (result === false) {
				renderInfo.type = 'danger';
				renderInfo.message = 'Couldn\'t generate SKU';
			} else if (result > 0) {
				renderInfo.type = 'warning';
				renderInfo.message = 'Item is already in the pricelist';
			}

			renderPricelist(renderInfo);
		})
		.catch((err) => {
			console.log(err);
			renderPricelist({ res, type: 'danger', message: 'Error occured' });
		});
});

module.exports = router;

