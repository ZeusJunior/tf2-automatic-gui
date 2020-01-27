// Handles express side of things

const path = require('path');
const express = require('express');
const app = express();
const bodyParser = require('body-parser');
const TF2Currencies = require('tf2-currencies');

const pricelist = require('./pricelist');

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

	if (removed == 0) pricelist.renderPricelist(res, 'danger', 'Somehow not able to remove items!');
	else if (removed) pricelist.renderPricelist(res, 'success', 'Removed ' + removed + (removed == 1 ? ' item' : ' items') + ' from your pricelist');
	else pricelist.renderPricelist(res, 'primary', 'none');
});

// Add a list of items to the pricelist
app.post('/add-items', async(req, res) => {
	req.body.input = req.body.input.split(/\r?\n/);
	req.body.input.forEach(function(item, index) {
		if (req.body.max - req.body.min < 1) {
			pricelist.renderPricelist(res, 'warning', 'The maximum stock must be atleast one higher than the minimum');
			return;
		}

		if (item.includes('classifieds')) {
			pricelist.renderPricelist(res, 'danger', 'Please use the items stats page or full name, not the classifieds link');
			return;
		}
	});
	
	pricelist.addItems(res, req.body.input, {
		intent: parseInt(req.body.intent),
		min: parseInt(req.body.min),
		max: parseInt(req.body.max)
	});
});

app.post('/changeItem', (req, res) => {
	if (req.body.max <= req.body.min) {
		pricelist.renderPricelist(res, 'warning', 'The maximum stock must be atleast one higher than the minimum');
		return;
	}

	const sellvalues = new TF2Currencies({keys: req.body.sellkeys, metal: req.body.sellmetal.replace(',', '.')}).toJSON();
	const buyvalues = new TF2Currencies({keys: req.body.buykeys, metal: req.body.buymetal.replace(',', '.')}).toJSON();

	// lower sell keys
	if (sellvalues.keys < buyvalues.keys) {
		pricelist.renderPricelist(res, 'warning', 'The sell price must be higher than the buy price');
		return;
	}
	// Same amount of keys, lower or equal sell metal
	if (sellvalues.keys === buyvalues.keys && sellvalues.metal <= buyvalues.metal) {
		pricelist.renderPricelist(res, 'warning', 'The sell price must be higher than the buy price');
		return;
	}

	const item = {
		sku: req.body.sku,
		sell: sellvalues,
		buy: buyvalues,
		intent: parseInt(req.body.intent),
		min: parseInt(req.body.min),
		max: parseInt(req.body.max)
	};

	const autoprice = req.body.autoprice == 'true';
	item.autoprice = autoprice;
	item.time = autoprice ? new Date().getTime() : 0;
	
	pricelist.changeSingleItem(res, item);
});

// Remove selected items from pricelist
app.post('/pricelist', async(req, res) => {
	const items = req.body.list;
	const removed = await pricelist.removeItems(items);
	const amountRemoved = removed === false ? 0 : removed;

	res.json({
		removed: amountRemoved
	});
});

// Burn the pricelist with fire
app.post('/clearPricelist', (req, res) => {
	pricelist.clearPricelist(res);
});


module.exports = app;
