// Handles express side of things

const path = require('path');
const express = require('express');
const app = express();
const bodyParser = require('body-parser');
const Currency = require('tf2-currencies');
const fs = require('fs-extra');

const pricelist = require('./pricelist');
const getPluralOrSingularString = require('../utils/getPluralOrSingularString');
const searchSchemaByNamePart = require('../utils/searchSchemaByNamePart');
const paths = require('../resources/paths');

// TODO: functionalize
app
	.use(express.static(path.join(__dirname, '../assets')))
	.set('views', path.join(__dirname, '../views'))
	.set('view engine', 'ejs')
	.use(bodyParser.json())
	.use(bodyParser.urlencoded({
		extended: false
	}));


app.get('/', (req, res) => {
	const removed = parseInt(req.query.removed);

	const renderInfo = {
		res,
		type: 'primary',
		message: 'none',
		failedItems: []
	};

	if (removed == 0) {
		renderInfo.type = 'danger';
		renderInfo.message = 'Somehow not able to remove items!';
	} else if (removed) {
		renderInfo.type = 'success';
		renderInfo.message = 'Removed ' + removed + (removed == 1 ? ' item' : ' items') + ' from your pricelist';
	}

	renderPricelist(renderInfo);
});

app.get('/add-item', (req, res) => {
	const name = req.query.name ? decodeURIComponent(req.query.name) : '';
	res.render('addSingle', {
		name
	});
});

app.post('/add-item', (req, res) => {
	const item = req.body.input;

	const { min, max, intent, sellmetal, sellkeys, buymetal, buykeys, autoprice } = req.body;

	if (item.includes('classifieds')) {
		renderPricelist({ res, type: 'danger', message: 'Please use the items stats page or full name, not the classifieds link' });
		return;
	}

	if (max - min < 1) {
		renderPricelist({ res, type: 'warning', message: 'The maximum stock must be atleast one higher than the minimum' });
		return;
	}

	const sellvalues = new Currency({ keys: sellkeys, metal: sellmetal.replace(',', '.') }).toJSON();
	const buyvalues = new Currency({ keys: buykeys, metal: buymetal.replace(',', '.') }).toJSON();

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

	const autopriced = autoprice == true;

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

app.post('/add-items', (req, res) => {
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

app.post('/changeItem', (req, res) => {
	const { sku, intent, autoprice, min, max, sellkeys, sellmetal, buykeys, buymetal } = req.body;

	if (max <= min) {
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

app.post('/pricelist', async (req, res) => {
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

app.post('/clearPricelist', (req, res) => {
	pricelist
		.clear()
		.then(() => {
			renderPricelist({
				res,
				type: 'success',
				message: 'Pricelist has been cleared'
			});
		})
		.catch((err) => {
			throw err;
		});
});

app.get('/search', (req, res) => {
	const search = decodeURIComponent(req.query.text);
	const results = searchSchemaByNamePart(search);
	
	res.json({
		results
	});
});

/**
 * Renders the pricelist page with info
 * @property {Object} res - The res from expressjs
 * @property {string} type - Alert type, can be "primary", "warning", "danger" or "success"
 * @property {string} message - The message to display in the alert
 * @property {Array} [failedItems] - Array of item names that failed
 * @return {undefined}
 */
function renderPricelist({ res, type, message, failedItems = [] }) {
	return fs.readJSON(paths.files.pricelist)
		.then((pricelist) => {
			res.render('index', {
				type,
				failedItems,
				msg: message,
				pricelist: pricelist
			});
		})
		.catch((err) => {
			throw err;
		});
}


module.exports = app;
