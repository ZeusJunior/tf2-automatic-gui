const fs = require('fs-extra');
const axios = require('axios');
const SKU = require('tf2-sku');
const paths = require('../resources/paths');


let schema;
exports.init = function() {
	const method = fs.existsSync(paths.files.schema) ? getSchema : fetchSchema;

	return method()
		.then((responseSchema) => {
			schema = responseSchema;

			return Promise.resolve();
		});
};

/**
 * Gets schema from file
 * @return {Object} schema
 */
function getSchema() {
	return fs.readJSON(paths.files.schema)
		.catch((err) => {
			return Promise.reject(
				new Error('Couldn\'t read schema file: ' + err.message)
			);
		});
};

/**
 * Gets schema from API
 * @return {Object} schema
 */
function fetchSchema() {
	return axios(
		{
			url: 'https://api.prices.tf/schema',
			method: 'GET',
			params: {
				appid: 440
			},
			json: true
		}
	)
		.then((response) => {
			fs.writeJSON(paths.files.schema, response.data);
      
			return response.data;
		})
		.catch((err) => {
			return Promise.reject(
				new Error('Couldn\'t get schema from prices.tf API: ' + err.message)
			);
		});
};

exports.get = function() {
	return schema;
};

/**
 * Binary search for item in schema
 * @param {String} sku sku of item
 * @return {Object} schemaItem / null if not found
 */
exports.getItemBySKU = function findItemBySKU(sku) {
	return findItemByDefindex(SKU.fromString(sku).defindex);
};

/**
 * Binary search for item in schema
 * @param {String} defindex defindex of item
 * @return {Object} schemaItem / null if not found
 */
exports.getItemByDefindex = function findItemByDefindex(defindex) {
	items = schema.raw.schema.items;
	let found;
	let start = 0;
	let end = items.length-1;
	while (start <= end) {
		const mid = Math.floor(start+end/2);
		if (items[mid].defindex < defindex) {
			start = mid + 1;
		} else if (items[mid].defindex > defindex) {
			end = mid - 1;
		} else {
			found = items[mid];
			break;
		}
	}
	return found;
};
