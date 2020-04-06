const fs = require('fs-extra');
const paths = require('../resources/paths');
const Currency = require('tf2-currencies');
const axios = require('axios');

// TODO: Make this into class
/**
 * @param {Bool} toKeys convert to keys if true
 * @param {Number} start time to start plot
 * @param {Number} interval time interval to plot
 * @param {Number} end time to end plot
 * @return {Object}
 */
exports.get = async function get(toKeys, start, interval, end) {
	const polldata = await fs.readJSON(paths.files.polldata);
	const response = await axios(
		{
			url: 'https://api.prices.tf/items/5021;6',
			method: 'GET',
			params: {
				src: 'bptf'
			},
			json: true
		}
	);
	const keyVal = response.data.sell.metal;
	const trades = Object.keys(polldata.offerData).map((key)=>{
		const ret = polldata.offerData[key];
		ret.time = polldata.timestamps[key];
		ret.id = key;
		return ret;
	});
	const itemStock = {};
	let overpriceProfit = 0;
	const overItems = {}; // items sold before being bought

	const tracker = new profitTracker(start, interval, end);

	trades.sort((a, b)=>{
		return a.time - b.time;
	});

	let iter = 0; // to keep track of how many trades are accepted
	for (let i = 0; i < trades.length; i++) {
		const trade = trades[i];
		if (!(trade.handledByUs === true && trade.isAccepted === true)) {
			continue;// trade was not accepted, go to next trade
		}
		iter++;
		let isGift = false;
		if (!Object.prototype.hasOwnProperty.call(trade, 'dict')) {
			continue;// trade has no items ?
		}
		if (typeof Object.keys(trade.dict.our).length == 'undefined') {
			isGift = true;// no items on our side, so it is probably gift
		} else if (Object.keys(trade.dict.our).length != 0) { // trade is not a gift
			if (!Object.prototype.hasOwnProperty.call(trade, 'value')) {
				continue; // trade is missing value object
			}
			if (!(Object.keys(trade.prices).length > 0)) {
				continue; // have no prices, broken, skip
			}
		} else {
			isGift = true; // no items on our side, so it is probably gift
		}
		if (typeof trade.value === 'undefined') {
			trade.value = {};
		}
		if (typeof trade.value.rate === 'undefined') {
			if (!Object.prototype.hasOwnProperty.call(trade, 'value')) trade.value = {}; // in case it was gift
			trade.value.rate = keyVal;// set key value to current value if it is not defined
		}
		for (sku in trade.dict.their) { // items bought
			if (Object.prototype.hasOwnProperty.call(trade.dict.their, sku)) {
				let itemCount = trade.dict.their[sku];

				if (sku !== '5000;6' && sku !== '5002;6' && sku !== '5001;6' && sku !== '5021;6') { // if it is not currency
					if (isGift) {
						if (!Object.prototype.hasOwnProperty.call(trade, 'prices')) trade.prices = {};
						trade.prices[sku] = { // set price to 0 because it's a gift
							buy: {
								metal: 0,
								keys: 0
							}
						};
					} else if (!Object.prototype.hasOwnProperty.call(trade.prices, sku)) {
						continue; // item is not in pricelist, so we will just skip it
					}
					const prices = trade.prices[sku].buy;
					if (Object.prototype.hasOwnProperty.call(overItems, sku)) { // if record for this item exists in overItems check it
						if (overItems[sku].count > 0) {
							if (overItems[sku].count >= itemCount) {
								overItems[sku].count -= itemCount;
								tracker.countProfit( (overItems[sku].price - convert(prices, trade.value.rate, toKeys)) * itemCount, trade.time);
								continue; // everything is already sold no need to add to stock
							} else {
								itemsOverOverItems = itemCount - overItems[sku].count;
								overItems[sku].count = 0;
								tracker.countProfit( (overItems[sku].price - convert(prices, trade.value.rate, toKeys)) * (itemCount - itemsOverOverItems), trade.time);
								itemCount = itemsOverOverItems;
							}
						}
					}
					addToList(itemStock, {amount: itemCount, sku: sku}, prices, trade, toKeys);
				}
			}
		}

		for (sku in trade.dict.our) {
			if (Object.prototype.hasOwnProperty.call(trade.dict.our, sku)) {
				const itemCount = trade.dict.our[sku];
				if (sku !== '5000;6' && sku !== '5002;6' && sku !== '5001;6' && sku !== '5021;6') { // TODO: TEST KEY TRADING BOTS
					const prices = trade.prices[sku].sell;
					if (Object.prototype.hasOwnProperty.call(itemStock, sku)) { // have we bought this item already
						if (itemStock[sku].count >= itemCount) {
							itemStock[sku].count -= itemCount;
							tracker.countProfit( (convert(prices, trade.value.rate) - itemStock[sku].price) * itemCount, trade.time);
						} else {
							const overCount = itemCount - itemStock[sku].count;
							addToList(overItems, {amount: overCount, sku: sku}, prices, trade, toKeys);
							itemStock[sku].count -= itemStock[sku].count;
							tracker.countProfit( (convert(prices, trade.value.rate) - itemStock[sku].price) * itemStock[sku].count, trade.time);
						}
					} else { // we have not bought this item yet
						addToList(overItems, {amount: itemCount, sku: sku}, prices, trade, toKeys);
					}
				}
			}
		}
		if (!isGift) { // calculate overprice profit
			overpriceProfit += convert(trade.value.their, trade.value.rate) - convert(trade.value.our, trade.value.rate);
			tracker.countProfit( convert(trade.value.their, trade.value.rate) - convert(trade.value.our, trade.value.rate), trade.time);
		}
	}
	// TODO: put into return object
	console.log(iter);
	console.log(itemStock);
	console.log(overItems);
	console.log(`Profit from overprice: ${overpriceProfit} ${toKeys?'keys':'scrap'}.`);
	console.log(`Total profit: ${tracker.profit} ${toKeys?'keys':'scrap'}.`);
	console.log(tracker.profitPlot);
	console.log(tracker.profitTimed);
	return {
		profitTotal: tracker.profit,
		profitTimed: tracker.profitTimed,
		profitPlot: tracker.profitPlot
	};
};


/**
 * 
 * @param {Object} prices {keys, metal} price to convert
 * @param {Number} keyPrice 
 * @param {Bool} toKeys 
 * @return {Number} converted
 */
function convert(prices, keyPrice, toKeys) {
	if (toKeys) {
		const item = new Currency({
			metal: prices.metal,
			keys: prices.keys
		}).toValue(keyPrice);
		const key = new Currency({
			metal: keyPrice
		}).toValue(keyPrice);
		return item / key;
	} else {
		const converted = new Currency(prices).toValue(keyPrice);
		return converted;
	}
}
/**
 * 
 * @param {Object} list list to add to
 * @param {Object} item {sku, ammount}
 * @param {Object} prices {metal, keys}
 * @param {Object} trade whole trade object
 * @param {Bool} toKeys convert to keys
 */
function addToList(list, item, prices, trade, toKeys) {
	if (Object.prototype.hasOwnProperty.call(list, item.sku)) { // check if record exists
		const priceAvg = list[item.sku].price;
		const itemCount = list[item.sku].count;
		list[item.sku].price = ((priceAvg * itemCount) + (item.amount * convert(prices, trade.value.rate, toKeys))) / (itemCount + item.amount); // calculate new item average price
		list[item.sku].count += item.amount;
	} else {
		list[item.sku] = {
			count: item.amount,
			price: convert(prices, trade.value.rate, toKeys)
		};
	}
}

/**
 * class for tracking profit and storing profit data
 */
class profitTracker {
	/**
	 * 
	 * @param {Number} start 
	 * @param {Number} interval 
	 * @param {Number} end 
	 */
	constructor(start, interval, end) {
		this.start = Number(typeof start != 'undefined' ? start : -1);
		this.interval = Number(typeof interval != 'undefined' ? interval : -1);
		this.end = Number(typeof end != 'undefined' ? end : Math.floor(Date.now()/1000));
		this.lastTradeTime = -1;
		
		this.tempProfit = 0;

		this.profit = 0;
		this.profitPlot = [];
		this.profitTimed = 0;
	}

	/**
	 * 
	 * @param {Number} normalizedAmount 
	 * @param {Number} time trade time 
	 */
	countProfit(normalizedAmount, time) {
		this.profit += normalizedAmount;
		if (time >= this.start && time < this.end) { // is within time of interest
			this.profitTimed += normalizedAmount;
			if (this.interval > 0) { // not first trade being evaluated and we have plot interval
				const lastTradePlotBlock = Math.floor((this.lastTradeTime - this.start) / this.interval);
				const thisTradePlotBlock = Math.floor((time - this.start) / this.interval);
				if (lastTradePlotBlock != thisTradePlotBlock && this.lastTradeTime !== -1) { // last block is done so we will push it to plot
					this.profitPlot.push({time: lastTradePlotBlock*this.interval + this.start, profit: this.tempProfit});
					this.tempProfit = normalizedAmount; // reset temp to value of current trade
				} else {
					this.tempProfit += normalizedAmount;
				}
			}
			this.lastTradeTime = time;
		} else if (this.lastTradeTime < this.end && this.tempProfit !== 0 && this.interval > 0) { // push last trade block to plot if plot is being created
			const lastTradePlotBlock = Math.floor((this.lastTradeTime - this.start) / this.interval);
			this.profitPlot.push({time: lastTradePlotBlock*this.interval + this.start, profit: this.tempProfit});
			this.tempProfit = 0;
		}
		
	}
}
