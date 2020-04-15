const fs = require('fs-extra');
const paths = require('../resources/paths');
const getName = require('../utils/getName');
const data = require('./data');
const moment = require('moment');
const getImage = require('../utils/getImage');
const SKU = require('tf2-sku');


exports.get = function() {
	return fs.readJSON(paths.files.polldata)
		.then((polldata) => {
			return Object.keys(polldata.offerData).map((key)=>{
				const offer = polldata.offerData[key];
				const ret = {
					id: key,
					lastChange: polldata.timestamps[key],
					items: {
						our: [],
						their: []
					},
					action: offer.action,
					partner: offer.partner,
					accepted: offer.accepted,
					time: offer.finishTimestamp,
					datetime: moment.unix(Math.floor(offer.finishTimestamp/1000)).format('ddd D-M-YYYY HH:mm'),
					value: offer.value,
					prices: offer.prices,
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
							ret.items.our.push(createTradeItem(k, offer.dict.our[k]));
						});
					}
					if (Object.keys(offer.dict.their).length > 0) {
						Object.keys(offer.dict.their).forEach((k)=>{
							ret.items.their.push(createTradeItem(k, offer.dict.their[k]));
						});
					}
				}

				return ret;
			});
		});
};

/**
 * Creates item object
 * @param {String} sku 
 * @param {number} amount 
 * @return {Object} item object created
 */
function createTradeItem(sku, amount) {
	const item = SKU.fromString(sku);
	item.sku = sku;
	item.name = getName(item.sku);
	item.style = getImage.getImageStyle(item.sku);
	item.amount = amount;
	return item;
}
