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

			Object.keys(polldata.sent).forEach((key)=>{
				const offer = polldata.offerData[key];
				if (!checkTradeRecord(offer)) return; // offer must have essential data to be valid
				trades.push(generateTrade(polldata, key, offer, 'sent'));
			});
			Object.keys(polldata.received).forEach((key)=>{
				const offer = polldata.offerData[key];
				if (!checkTradeRecord(offer)) return; // offer must have essential data to be valid
				trades.push(generateTrade(polldata, key, offer, 'received'));
			});
			/*
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
			});*/

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
	return Object.prototype.hasOwnProperty.call(offer, 'partner') && Object.prototype.hasOwnProperty.call(offer, 'dict');
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
		lastState: data.ETradeOfferState[polldata.sent[key]],
		lastChange: polldata.timestamps[key],
		items: {
			our: [],
			their: []
		},
		partner: offer.partner,
		accepted: offer.accepted,
		date: getDate(offer.finishTimestamp),
		time: getTime(offer.finishTimestamp),
		actionTime: offer.actionTime,
		confirmationTime: offer.confirmationTime,
		actedOnConfirmation: offer.actedOnConfirmation,
		value: offer.value,
		prices: offer.prices
	};
	if (Object.keys(offer.dict.our).length > 0) {
		Object.keys(offer.dict.our).forEach((k)=>{
			trade.items.our.push(createTradeItem(k, offer.dict.our[k]));
		});
	}
	if (Object.keys(offer.dict.their).length > 0) {
		Object.keys(offer.dict.their).forEach((k)=>{
			trade.items.our.push(createTradeItem(k, offer.dict.our[k]));
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
	item.image = getImage.getImage(item.defindex);
	item.amount = amount;
	item.name=getName(sku);
	return item;
}
