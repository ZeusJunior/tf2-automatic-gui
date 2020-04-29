const express = require('express');
const router = express.Router();
const paths = require('../../resources/paths');
const fs = require('fs-extra');
const getName = require('../../utils/getName');
const getImage = require('../../utils/getImage');
const axios = require('axios');
const Currency = require('tf2-currencies');

let lastKeyCheck = 0;
let lastKeyPrice = 0;

router.get('/', (req, res) => {
	fs.readJSON(paths.files.pricelist)
		.then((pricelist) => {
			if (Date.now() - lastKeyCheck > 30 * 60 * 1000) { // update keyprice every 30 minutes and keep it in memory
				lastKeyCheck = Date.now();
				axios({
					url: 'https://api.prices.tf/items/5021;6',
					method: 'GET',
					params: {
						src: 'bptf'
					},
					json: true
				}).then(({ data }) => {
					if (!data.success) {
						throw new Error('Couldn\'t get key price from pricestf: ' + data.message);
					}
					lastKeyPrice = data.sell.metal;
					servePricelist(lastKeyPrice, pricelist, res);
				});
			} else {
				servePricelist(lastKeyPrice, pricelist, res);
			}
		})
		.catch((err) => {
			throw err;
		});
});

module.exports = router;

/**
 * 
 * @param {Number} keyPrice price of key in metal
 * @param {Object} pricelist pricelist form file
 * @param {Object} res response to act on
 */
function servePricelist(keyPrice, pricelist, res) {
	for (i = 0; i < pricelist.length; i++) {
		const item = pricelist[i];
		if (!item.name) {
			item.name = getName(item.sku);
		}
		item.buy.total = new Currency({
			metal: item.buy.metal,
			keys: item.buy.keys
		}).toValue(keyPrice); // convert buy price to scrap with actual key value to scrap for sorting purposes
		item.sell.total = new Currency({
			metal: item.sell.metal,
			keys: item.sell.keys
		}).toValue(keyPrice); // convert sell price to scrap with actual key value to scrap for sorting purposes
		item.style = getImage.getImageStyle(item.sku);
	}
	res.json({
		pricelist
	});
}
