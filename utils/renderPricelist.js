const fs = require('fs-extra');
const paths = require('../resources/paths');
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
