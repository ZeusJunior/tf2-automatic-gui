const fs = require('fs-extra');
const paths = require('../resources/paths');
const getName = require('../utils/getName');
const _ = require('lodash');


exports.get = function() {
	return fs.readJSON(paths.files.polldata)
		.then((polldata) => {
			const trades = [];

			_.forOwn(polldata.offerData, (offer, id) => {
				const accepted = offer.isAccepted ? 'Yes' : 'No';
				
				const data = {
					id,
					partner: offer.partner,
					accepted: accepted,
					date: getDate(offer.finishTimestamp),
					received: getItemsFromOffer(offer, 'their'),
					sent: getItemsFromOffer(offer, 'our')
				};

				trades.push(data);
			});

			return trades;
		});
};

/**
 * Create a nicely formatted date string from unix
 * @param {number} unix Unix time
 * @return {string} Formatted date string
 */
function getDate(unix) {
	const date = new Date(unix);
	const year = date.getFullYear();
	const month = ('0' + (date.getMonth() + 1)).slice(-2);
	const hour = ('0' + date.getHours()).slice(-2);
	const day = ('0' + (date.getDate() + 1)).slice(-2);
	const minute = date.getMinutes();

	const time = year + '-' + month + '-' + day + ' ' + hour + ':' + minute;

	return time;
}

/**
 * Get items from offer formatted with amount.
 * @param {Object} offer The offerData entry .
 * @param {string} whose Whose items to get from the trade.
 * @return {string[]} Formatted item string names.
 */
function getItemsFromOffer(offer, whose) {
	const items = [];

	if (offer.dict) {
		_.forOwn(offer.dict[whose], (amount, sku) => {
			let itemStr = getName(sku);
			if (amount > 1) {
				itemStr += ' x' + amount;
			}
	
			items.unshift(itemStr);
		});

		return items;
	}

	return [];
}
