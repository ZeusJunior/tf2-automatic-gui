const fs = require('fs-extra');
const paths = require('../resources/paths');
const getName = require('../utils/getName');
const data = require('./data');
const moment = require('moment');
const getImage = require('../utils/getImage');
const profit = require('./profit');

/**
 * 
 * @param {Number} first index of first trade to be included in results
 * @param {Number} count how many trades to include in results, set to -1 to return all
 * @param {Boolean} descending sort
 * @param {String} search string to search listings for
 */
exports.get = async function(first, count, descending, search) {
	search = search.trim().toLowerCase();
	const polldata = await fs.readJSON(paths.files.polldata);
	const profitData = (await profit.get(undefined, undefined, undefined, true)).tradeProfits;
	let tradeList = Object.keys(polldata.offerData).map((key) => {
		const ret = polldata.offerData[key];
		ret.id = key;
		return ret;
	});
	const tradeCount = tradeList.length;
	tradeList = tradeList.sort((a, b) => {
		a = a.finishTimestamp;
		b = b.finishTimestamp;

		// check for undefined time, sort those at the end
		if ( (!a || isNaN(a)) && !(!b || isNaN(b))) return 1;
		if ( !(!a || isNaN(a)) && (!b || isNaN(b))) return -1;
		if ( (!a || isNaN(a)) && (!b || isNaN(b))) return 0;

		if (descending) b = [a, a = b][0];

		return a - b;
	});
	tradeList = tradeList.filter((offer) => {
		let offerSearchResults = false;
		if (Object.prototype.hasOwnProperty.call(offer, 'dict')) {
			offerSearchResults = Object.keys(offer.dict.our).reduce((accumulator, item) => {
				return accumulator || getName(item).toLowerCase().indexOf(search) > -1;
			}, false);
			offerSearchResults |= Object.keys(offer.dict.our).reduce((accumulator, item) => {
				return accumulator || getName(item).toLowerCase().indexOf(search) > -1;
			}, false);
		}
		return offer.id.indexOf(search) > -1 || offerSearchResults;
	});
	if (count != -1) tradeList = tradeList.slice(first, first + count);
	const items = {};
	const trades = tradeList.map((offer) => {
		const ret = {
			id: offer.id,
			items: {
				our: [],
				their: []
			},
			profit: Object.prototype.hasOwnProperty.call(profitData, offer.id)?profitData[offer.id]: '',
			partner: offer.partner,
			accepted: offer.accepted,
			time: offer.finishTimestamp,
			datetime: moment.unix(Math.floor(offer.finishTimestamp/1000)).format('ddd D-M-YYYY HH:mm'),
			value: offer.value,
			accepted: offer.handledByUs === true && offer.isAccepted === true
		};

		if (typeof polldata.sent[offer.id] != 'undefined') ret.lastState = data.ETradeOfferState[polldata.sent[offer.id]];
		else if (typeof polldata.received[offer.id] != 'undefined') ret.lastState = data.ETradeOfferState[polldata.received[offer.id]];

		if (Object.prototype.hasOwnProperty.call(offer, 'dict')) {
			if (Object.keys(offer.dict.our).length > 0) tradeSide('our');
			if (Object.keys(offer.dict.their).length > 0) tradeSide('their');
		}

		return ret;

		/**
		 * Get items from one side of a trade
		 * @param {'our'|'their'} side 
		 */
		function tradeSide(side) {
			Object.keys(offer.dict[side]).forEach((k) => {
				if (!Object.prototype.hasOwnProperty.call(items, k)) items[k] = createTradeItem(k);
				ret.items[side].push({
					sku: k,
					amount: offer.dict[side][k]
				});
			});
		}
	});
	return {
		trades,
		items,
		tradeCount
	};
};

/**
 * Creates item object
 * @param {String} sku 
 * @return {Object} item object created
 */
function createTradeItem(sku) {
	return {
		name: getName(sku),
		style: getImage.getImageStyle(sku)
	};
}
