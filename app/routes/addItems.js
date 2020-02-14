const express = require('express');
const router = express.Router();
const pricelist = require('../pricelist');
const renderPricelist = require('../../utils/renderPricelist');
const getPluralOrSingularString = require('../../utils/getPluralOrSingularString');

router.post('/', (req, res) => {
	const input = req.body.input.split(/\r?\n/);

	if (req.body.max - req.body.min < 1) {
		renderPricelist({ res, type: 'warning', message: 'The maximum stock must be atleast one higher than the minimum' });
		return;
	}

	input.forEach(function(item) {
		if (item.includes('classifieds')) {
			renderPricelist({ res, type: 'danger', message: 'Please use the items stats page or full name, not the classifieds link' });
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
			const message = `${itemsAdded} item${getPluralOrSingularString(itemsAdded)} added
							, ${itemsFailed} item${getPluralOrSingularString(itemsFailed)} failed
							${(alreadyAdded > 0 ? `, ${alreadyAdded} ${alreadyAdded == 1 ? 'item was' : 'items were'} already in your pricelist` : '')}
							.`;
				
			renderPricelist({ res, type: 'primary', message, failedItems: failedItems });
		})
		.catch((err) => {
			throw err;
		});
});

module.exports = router;
