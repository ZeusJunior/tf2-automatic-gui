const request = require('request-promise');
const fs = require('fs-extra');
const getSKU = require('../utils/getSKU');
const getName = require('../utils/getName');


const pricelist = module.exports;


pricelist.addItems = async function(search, options) {
	let skus = [];
	const items = []; // Why did you delete?
	let itemsFailed = 0;
	let itemsAdded = 0;
	let failedItems = [];

	for (let i = 0; i < search.length; i++) {
		if (search[i].indexOf('Part') > -1) {
			search[i] = search[i].split(' with ').shift();
		}
		if (search[i].indexOf(' painted ') > -1) {
			search[i] = search[i].split(' painted ').shift();
		}
		if (search[i] === '') {
			search.splice(i, 1);
			i--;
		}
	}

	return getAllPrices()
		.then(async (prices) => {
			console.log('Got all prices, continuing...');

			for (let i = 0; i < prices.length; i++) {
				if (search.indexOf(prices[i].name) > -1) {
					skus.push(prices[i].sku);
					search.splice(search.indexOf(prices[i].name), 1);
				}
			}

			/**
			 * Keeping it split into two then's
			 * for better readability for now.
			 * ^ You can not do this if you're not taking scope into account
			 */
			const generatedSkus = search.map((item) => getSKU(item));
			skus = skus.concat(generatedSkus);

			const start = new Date();

			for (let i = 0; i < skus.length; i++) {
				if (skus[i] === false) {
					skus.splice(skus.indexOf(skus[i]), 1);
					itemsFailed++;
					i--;
				}
			}

			for (let i = 0; i < prices.length; i++) {
				const { sku, name, buy, sell, time } = prices[i];
				
				if (skus.indexOf(sku) > -1) {
					if (buy === null || sell === null) {
						continue;
					}
					
					const listing = {
						sku,
						enabled: true,
						autoprice: true,
						max: options.max,
						min: options.min,
						intent: options.intent,
						name: '',
						buy: {},
						sell: {},
						time: 0
					};
					listing.name = name;
					listing.buy = buy;
					listing.sell = sell;
					listing.time = time;

					// Add item to items array, these will be used to update the pricelist and remove from skus array
					items.push(listing);
					skus.splice(skus.indexOf(sku), 1);
					itemsAdded++;
				}

				if (i == prices.length - 1) { // Done looping
					const end = new Date() - start;
					
					console.info('Execution time: %dms', end);
					
					itemsFailed += skus.length; // items that succeeded get removed from skus 
					failedItems = skus; // so all thats left in skus is failed items

					if (itemsAdded > 0) {
						try {
							const result = await addItemsToPricelist(items);

							if (result > 0) {
								itemsAdded -= result;
							}

							return {
								itemsAdded: itemsAdded,
								itemsFailed: itemsFailed,
								alreadyAdded: result,
								failedItems: failedItems
							};
						} catch (err) {
							return Promise.reject(err);
						}
					} ;
					
					return {
						itemsAdded: itemsAdded,
						itemsFailed: itemsFailed,
						failedItems: failedItems
					};
				}
			}
		});
};

pricelist.addSingleItem = function(search, { autoprice, max, min, intent, buy, sell }) {
	const sku = getSKU(search);
	
	if (sku === false) return Promise.resolve(false);

	const item = {
		name: getName(sku),
		sku: sku,
		enabled: true,
		time: 0,
		autoprice,
		max,
		min,
		intent,
		buy,
		sell
	};

	/**
	 * Time when item got autopriced.
	 */
	item.time = autoprice ? parseInt(new Date().getTime() / 1000) : 0;

	return addItemsToPricelist([item]);
};

pricelist.changeSingleItem = function(item) {
	return fs.readJSON(paths.files.config)
		.then((pricelist) => {
			pricelist.forEach((pricedItem) => {
				if (item.sku === pricedItem.sku) {
					pricedItem.buy = item.buy;
					pricedItem.sell = item.sell;
					pricedItem.intent = item.intent;
					pricedItem.min = item.min;
					pricedItem.max = item.max;
					pricedItem.autoprice = item.autoprice;
					pricedItem.time = item.time;
				}
			});

			return fs.writeJSON(paths.files.config, pricelist);
		});
};

pricelist.removeItems = async function(items) {
	if (!items || items.length == 0) {
		return false;
	}

	if (!Array.isArray(items)) {
		items = [items];
	}

	try {
		const result = await removeItemsFromPricelist(items);

		return !result ? false : result;
	} catch (err) {
		return Promise.reject(err);
	}
};

function addItemsToPricelist(items) {
	let alreadyAdded = 0;

	return fs.readJSON(paths.files.config)
		.then((pricelist) => {
			items: for (let i = 0; i < items.length; i++) {
				for (let y = 0; y < pricelist.length; y++) {
					if (pricelist[y].sku === items[i].sku) {
						alreadyAdded++;

						continue items;
					}
				}

				pricelist.push(items[i]);
			}

			return fs.writeJSON(paths.files.config, pricelist);
		})
		.then(() => {
			return alreadyAdded;
		});
}

function removeItemsFromPricelist(items) {
	let itemsRemoved = 0;

	return fs.readJSON(paths.files.config)
		.then((pricelist) => {
			for (let i = 0; i < pricelist.length; i++) {
				for (let y = 0; y < items.length; y++) {
					if (pricelist[i].sku === items[y]) {
						itemsRemoved++;
						
						pricelist.splice(pricelist.indexOf(pricelist[i]), 1);
					}
				}
			}

			return fs.writeJSON(paths.files.config, pricelist);
		})
		.then(() => {
			return itemsRemoved;
		});
}

pricelist.clear = function() {
	return fs.writeJSON(paths.files.config, []);
};

function getAllPrices() {
	console.log('Getting all prices...');

	const options = {
		method: 'GET',
		json: true,
		uri: 'https://api.prices.tf/items',
		qs: {
			src: 'bptf'
		},
		json: true
	};

	if (fs.existsSync(paths.files.config)) {
		const config = require(paths.files.config);
		if (config.pricesApiToken) {
			options.headers = {
				Authorization: 'Token ' + config.pricesApiToken
			};
		}
	}

	const start = new Date();

	return request(options)
		.then(({ success, message, items }) => {
			if (!success) {
				if (message === 'Unauthorized') {
					throw new Error('Your prices.tf api token is incorrect. Join the discord here https://discord.tf2automatic.com/ and request one from Nick. Or leave it blank in the config.');
				}

				throw new Error('Couldn\'t get all prices from pricestf: ' + body);
			}

			const end = new Date() - start;
			console.info('Execution time: %dms', end);

			return items;
		});
}
