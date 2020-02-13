const fs = require('fs-extra');
const paths = require('../resources/paths');
const getName = require('../utils/getName');

exports.get = function() {
	return fs.readJSON(paths.files.polldata)
		.then((polldata) => {
			const trades = [];
			// eslint-disable-next-line guard-for-in
			for (offerid in polldata.offerData) {
				const offer = polldata.offerData[offerid];
				const accepted = offer.isAccepted ? 'Yes' : 'No';
				const data = {
					id: offerid,
					partner: offer.partner,
					accepted: accepted,
					date: getDate(offer.finishTimestamp),
					received: getItemsFromOffer(offer, 'their'),
					sent: getItemsFromOffer(offer, 'our')
				};

				trades.push(data);
			}

			return trades;
		});
};

/**
 * Create a nicely formatted date string from unix
 * @param {int} unix - Unix time
 * @return {string} - Formatted date string
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
 * 
 * @param {Object} offer - The offerData entry 
 * @param {'our' | 'their'} whose - Whose items to get from the trade
 * @return {Array} - Array of strings with name + amount. For example: "Refined Metal x32". Without number if its just one
 */
function getItemsFromOffer(offer, whose) {
	const items = [];

	// eslint-disable-next-line guard-for-in
	for (sku in offer.dict[whose]) {
		let str = '';
		str += getName(sku);
		if (offer.dict[whose][sku] > 1) {
			str += ' x' + offer.dict[whose][sku];
		}

		items.push(str);
	}
	return items;
}
