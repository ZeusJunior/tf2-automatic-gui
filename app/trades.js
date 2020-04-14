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
			const trades = [];
			Object.keys(polldata.timestamps).forEach((key)=>{
				if (typeof polldata.sent[key] != 'undefined') {
					const offer = polldata.offerData[key];
					if (!checkTradeRecord(offer)) return; // offer must have essential data to be valid
					trades.push(generateTrade(polldata, key, offer, 'sent'));
				} else if (typeof polldata.received[key] != 'undefined') {
					const offer = polldata.offerData[key];
					if (!checkTradeRecord(offer)) return; // offer must have essential data to be valid
					trades.push(generateTrade(polldata, key, offer, 'received'));
				} else {
					console.log(`offer ${key} is not logged correctly`);
				}
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
 * Generates time since start of day
 * @param {number} unix Unix times
 * @return {number} Seconds since start of day
 */
function getTime(unix) {
	let time = moment.unix(unix);
	const dayStart = time.startOf('day').unix();
	time -= dayStart;
	return time;
}

/**
 * Checks if offer has all necesary data
 * @param {Object} offer offer record to check
 * @return {boolean} valid
 */
function checkTradeRecord(offer) {
	if (typeof offer === 'undefined') return false;
	if (!Object.prototype.hasOwnProperty.call(offer, 'dict')) {
		return false;
	}
	return true;
}
/**
 * Generates trade object
 * @param {Object} polldata raw trade data
 * @param {String} key offerID 
 * @param {Object} offer polldata.offerData[key]
 * @param {String} type offer type - sent/recieved
 * @return {object} trade object
 */
function generateTrade(polldata, key, offer, type) {
	const trade = {
		id: key,
		type: type,
		lastState: type=='sent' ? data.ETradeOfferState[polldata.sent[key]] : data.ETradeOfferState[polldata.received[key]],
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
	if (Object.keys(offer.dict.our).length > 0) {
		Object.keys(offer.dict.our).forEach((k)=>{
			trade.items.our.push(createTradeItem(k, offer.dict.our[k]));
		});
	}
	if (Object.keys(offer.dict.their).length > 0) {
		Object.keys(offer.dict.their).forEach((k)=>{
			trade.items.their.push(createTradeItem(k, offer.dict.their[k]));
		});
	}
	return trade;
}
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
