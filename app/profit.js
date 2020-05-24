const fs = require('fs-extra');
const paths = require('../resources/paths');
const Currency = require('tf2-currencies');
const axios = require('axios');

// TODO: Make this into class
/**
 * @param {Number} start time to start plot
 * @param {Number} interval time interval to plot, set to -1 or undefined to disable profit plot
 * @param {Number} end time to end plot, set to -1 to disale profit timed and plot or undefined to disable just plot
 * @param {Boolean} enableTrades enable return of profit data for each trade
 * @return {Object}
 */
exports.get = async function get(start, interval, end, enableTrades) {
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
	const trades = Object.keys(polldata.offerData).map((key) => {
		const ret = polldata.offerData[key];
		ret.time = polldata.timestamps[key];
		ret.id = key;
		return ret;
	});
	let overpriceProfit = 0;

	const tracker = new itemTracker(start, interval, end, keyVal);

	trades.sort((a, b) => {
		a = a.time;
		b = b.time;

		// check for undefined time, sort those at the beggining, they will be skipped
		if ( (!a || isNaN(a)) && !(!b || isNaN(b))) return -1;
		if ( !(!a || isNaN(a)) && (!b || isNaN(b))) return 1;
		if ( (!a || isNaN(a)) && (!b || isNaN(b))) return 0;
		return a - b;
	});

	const tradeProfits = {};

	let iter = 0; // to keep track of how many trades are accepted
	for (let i = 0; i < trades.length; i++) { // TODO: ADMIN TRADES
		const trade = trades[i];
		if (!(trade.handledByUs === true && trade.isAccepted === true)) {
			continue;// trade was not accepted, go to next trade
		}

		let tradeProfit = 0;

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
				const itemCount = trade.dict.their[sku];

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

					tradeProfit += tracker.boughtItem(itemCount, sku, prices, trade.value.rate, trade.time);
				}
			}
		}

		for (sku in trade.dict.our) {
			if (Object.prototype.hasOwnProperty.call(trade.dict.our, sku)) {
				const itemCount = trade.dict.our[sku];
				if (sku !== '5000;6' && sku !== '5002;6' && sku !== '5001;6' && sku !== '5021;6') {
					if (!Object.prototype.hasOwnProperty.call(trade.prices, sku)) {
						continue; // item is not in pricelist, so we will just skip it
					}
					const prices = trade.prices[sku].sell;
					tradeProfit += tracker.soldItem(itemCount, sku, prices, trade.value.rate, trade.time);
				}
			}
		}
		if (!isGift) { // calculate overprice profit
			tradeProfit += tracker.convert(trade.value.their, trade.value.rate) - tracker.convert(trade.value.our, trade.value.rate);
			overpriceProfit += tracker.convert(trade.value.their, trade.value.rate) - tracker.convert(trade.value.our, trade.value.rate);
			tracker.profitTrack.countProfit( tracker.convert(trade.value.their, trade.value.rate) - tracker.convert(trade.value.our, trade.value.rate), trade.time);
		}
		tradeProfits[trade.id] = tracker.profitTrack.getFormatted(tradeProfit);
	}
	const returnObj = {
		profitTotal: tracker.profitTrack.getFormatted(tracker.profitTrack.profit),
		profitTimed: tracker.profitTrack.getFormatted(tracker.profitTrack.profitTimed),
		profitPlot: tracker.profitTrack.profitPlot,
		numberOfTrades: iter,
		overpriceProfit: tracker.profitTrack.getFormatted(overpriceProfit),
		keyValue: keyVal
	};
	if (enableTrades) returnObj['tradeProfits'] = tradeProfits;
	return returnObj;
};

/**
 * class for tracking profit and storing profit data
 */
class profitTracker {
	/**
	 * 
	 * @param {Number} start 
	 * @param {Number} interval 
	 * @param {Number} end 
	 * @param {Number} currentKey current key price
	 */
	constructor(start, interval, end, currentKey) {
		this.start = Number(typeof start != 'undefined' ? start : -1);
		this.interval = Number(typeof interval != 'undefined' ? interval : -1);
		this.end = Number(typeof end != 'undefined' ? end : Math.floor(Date.now()/1000));
		this.lastTradeTime = -1;
		this.currentKey = currentKey;
		this.tempProfit = 0;

		this.profit = 0;
		this.profitPlot = [];
		this.profitTimed = 0;
	}

	/**
	 * 
	 * @param {Number} normalizedAmount amount of profit made normalized to keys or scrap
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
					this.profitPlot.push({
						time: lastTradePlotBlock*this.interval + this.start,
						profit: this.tempProfit,
						formatted: this.getFormatted(this.tempProfit)
					});
					for (let i = lastTradePlotBlock+1; i < thisTradePlotBlock; i++) { // create block even if no trades happend
						this.profitPlot.push({
							time: i*this.interval + this.start,
							profit: 0,
							formatted: this.getFormatted(0)
						});
					}
					this.tempProfit = normalizedAmount; // reset temp to value of current trade
				} else {
					this.tempProfit += normalizedAmount;
				}
			}
			this.lastTradeTime = time;
		} else if (this.lastTradeTime < this.end && this.tempProfit !== 0 && this.interval > 0) { // push last trade block to plot if plot is being created
			const lastTradePlotBlock = Math.floor((this.lastTradeTime - this.start) / this.interval);
			this.profitPlot.push({
				time: lastTradePlotBlock*this.interval + this.start,
				profit: this.tempProfit,
				formatted: this.getFormatted(this.tempProfit)
			});
			this.tempProfit = 0;
		}
	}

	/**
	 * 
	 * @param {Number} normalPrice 
	 * @return {String} formatted string
	 */
	getFormatted(normalPrice) {
		const key = new Currency({
			metal: this.currentKey
		}).toValue(this.currentKey); // get value in scrap 
		const metal = Currency.toRefined(normalPrice % key);
		const keys = normalPrice>0 ? Math.floor(normalPrice / key) : Math.ceil(normalPrice / key);
		return new Currency({
			keys,
			metal
		}).toString();
	}
}
/**
 * this class tracks items in our inventory and their price
 */
class itemTracker {
	/**
	 * 
	 * @param {Number} start 
	 * @param {Number} interval 
	 * @param {Number} end 
	 * @param {Number} currentKey current key value
	 */
	constructor(start, interval, end, currentKey) {
		this.itemStock = {};
		this.overItems = {}; // items sold before being bought
		this.itemPricePlot = {};
		this.profitTrack = new profitTracker(start, interval, end, currentKey);
	}

	/**
	 * 
	 * @param {Number} itemCount item to add
	 * @param {String} sku 
	 * @param {Object} prices prices for this item
	 * @param {Number} rate key rate
	 * @param {Number} time
	 * @return {Number} profit made on this item
	 */
	boughtItem(itemCount, sku, prices, rate, time) {
		let itemProfit = 0;
		if (Object.prototype.hasOwnProperty.call(this.overItems, sku)) { // if record for this item exists in overItems check it
			if (this.overItems[sku].count > 0) {
				if (this.overItems[sku].count >= itemCount) {
					this.overItems[sku].count -= itemCount;
					this.profitTrack.countProfit( (this.overItems[sku].price - this.convert(prices, rate)) * itemCount, time);
					return (this.overItems[sku].price - this.convert(prices, rate)) * itemCount; // everything is already sold no need to add to stock
				} else {
					const itemsOverOverItems = itemCount - this.overItems[sku].count;
					this.overItems[sku].count = 0;
					this.profitTrack.countProfit( (this.overItems[sku].price - this.convert(prices, rate)) * (itemCount - itemsOverOverItems), time);
					itemProfit += (this.overItems[sku].price - this.convert(prices, rate)) * (itemCount - itemsOverOverItems);
					itemCount = itemsOverOverItems;
				}
			}
		}
		if (Object.prototype.hasOwnProperty.call(this.itemStock, sku)) { // check if record exists
			const priceAvg = this.itemStock[sku].price;
			const itemCountStock = this.itemStock[sku].count;
			this.itemStock[sku].price = ((priceAvg * itemCountStock) + (itemCount * this.convert(prices, rate))) / (itemCountStock + itemCount); // calculate new item average price
			this.itemStock[sku].count += itemCount;
		} else {
			this.itemStock[sku] = {
				count: itemCount,
				price: this.convert(prices, rate)
			};
		}
		return itemProfit;
	}

	/**
	 * 
	 * @param {Number} itemCount number of items sold
	 * @param {String} sku 
	 * @param {Object} prices prices for item sold
	 * @param {Number} rate key rate
	 * @param {Number} time time of trade
	 * @return {Number} profit made on this item
	 */
	soldItem(itemCount, sku, prices, rate, time) {
		let itemProfit = 0;
		if (Object.prototype.hasOwnProperty.call(this.itemStock, sku)) { // have we bought this item already
			if (this.itemStock[sku].count >= itemCount) {
				this.itemStock[sku].count -= itemCount;
				this.profitTrack.countProfit( (this.convert(prices, rate) - this.itemStock[sku].price) * itemCount, time);
				return (this.convert(prices, rate) - this.itemStock[sku].price) * itemCount;
			} else {
				itemProfit += (this.convert(prices, rate) - this.itemStock[sku].price) * this.itemStock[sku].count;
				this.profitTrack.countProfit( (this.convert(prices, rate) - this.itemStock[sku].price) * this.itemStock[sku].count, time);
				itemCount -= this.itemStock[sku].count;
				this.itemStock[sku].count = 0;
			}
		}
		if (Object.prototype.hasOwnProperty.call(this.overItems, sku)) { // check if record exists
			const priceAvg = this.overItems[sku].price;
			const itemCountStock = this.overItems[sku].count;
			this.overItems[sku].price = ((priceAvg * itemCountStock) + (itemCount * this.convert(prices, rate))) / (itemCountStock + itemCount); // calculate new item average price
			this.overItems[sku].count += itemCount;
		} else {
			this.overItems[sku] = {
				count: itemCount,
				price: this.convert(prices, rate)
			};
		}
		return itemProfit;
	}

	/**
	 * 
	 * @param {Object} prices {keys, metal} price to convert
	 * @param {Number} keyPrice 
	 * @return {Number} converted
	 */
	convert(prices, keyPrice) {
		const converted = new Currency(prices).toValue(keyPrice);
		return converted;
	}
}
