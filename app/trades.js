const fs = require('fs-extra');
const paths = require('../resources/paths');
const getName = require('../utils/getName');
const data = require('./data');
const moment = require('moment');
const getImage = require('../utils/getImage');
const profit = require('./profit');


exports.get = async function() {
	const polldata = await fs.readJSON(paths.files.polldata);
	const profitData = (await profit.get(undefined, undefined, undefined, true)).tradeProfits;
	const items = {};
	const trades = Object.keys(polldata.offerData).map((key)=>{
		const offer = polldata.offerData[key];
		const ret = {
			id: key,
			items: {
				our: [],
				their: []
			},
			profit: Object.prototype.hasOwnProperty.call(profitData, key)?profitData[key]: '',
			partner: offer.partner,
			accepted: offer.accepted,
			time: offer.finishTimestamp,
			datetime: moment.unix(Math.floor(offer.finishTimestamp/1000)).format('ddd D-M-YYYY HH:mm'),
			value: offer.value,
			accepted: offer.handledByUs === true && offer.isAccepted === true
		};
		if (typeof polldata.sent[key] != 'undefined') {
			ret.lastState = data.ETradeOfferState[polldata.sent[key]];
		} else if (typeof polldata.received[key] != 'undefined') {
			ret.lastState = data.ETradeOfferState[polldata.received[key]];
		}
		if (Object.prototype.hasOwnProperty.call(offer, 'dict')) {
			if (Object.keys(offer.dict.our).length > 0) {
				Object.keys(offer.dict.our).forEach((k)=>{
					if (!Object.prototype.hasOwnProperty.call(items, k)) {
						items[k] = createTradeItem(k);
					}
					ret.items.our.push({
						sku: k,
						amount: offer.dict.our[k]
					});
				});
			}
			if (Object.keys(offer.dict.their).length > 0) {
				Object.keys(offer.dict.their).forEach((k)=>{
					if (!Object.prototype.hasOwnProperty.call(items, k)) {
						items[k] = createTradeItem(k);
					}
					ret.items.their.push({
						sku: k,
						amount: offer.dict.their[k]
					});
				});
			}
		}
		return ret;
	});
	return {
		trades,
		items
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
