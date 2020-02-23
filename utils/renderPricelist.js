const fs = require('fs-extra');
const Currency = require('tf2-currencies');
const paths = require('../resources/paths');
const getName = require('./getName');
/**
 * Renders the pricelist page with info
 * @property {Object} res - The res from expressjs
 * @property {string} type - Alert type, can be "primary", "warning", "danger" or "success"
 * @property {string} message - The message to display in the alert
 * @property {Array} [failedItems] - Array of item names that failed
 * @return {undefined}
 */
module.exports = function({ res, type, message, failedItems = [] }) {
	return fs.readJSON(paths.files.pricelist)
		.then((pricelist) => {
			for (i = 0; i < pricelist.length; i++) {
				const item = pricelist[i];
				if (!item.name) {
					item.name = getName(item.sku);
				}
				
				item.sellorder = new Currency({ keys: item.sell.keys, metal: item.sell.metal }).toValue(60);
				item.buyorder = new Currency({ keys: item.buy.keys, metal: item.buy.metal }).toValue(60);
			}
			
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
};
