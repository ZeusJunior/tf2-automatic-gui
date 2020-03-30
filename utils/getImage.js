const Schema = require('../app/schema');
const SKU = require('tf2-sku');
/**
 * 
 * @param {number} defindex item defindex
 * @return {Object} Item image links - {small: 'link', large: 'link'}
 */
exports.getImage = function getImage(defindex) {
	const items = Schema.get().raw.schema.items;
	let found;
	for (let i = 0; i < items.length; i++) {
		const item = items[i];
		if (item.defindex === defindex) {
			found = item;
			break;
		}
	}
	if (typeof found == undefined) {
		console.log(defindex);
		return;
	}
	return {small: found.image_url, large: found.image_url_large};
};

/**
 * 
 * @param {string} sku item SKU
 * @return {Object} Item image links - {small: 'link', large: 'link'}
 */
exports.getImageFromSKU = function getImageFromSKU(sku) {
	const items = Schema.get().raw.schema.items;
	let found;
	for (let i = 0; i < items.length; i++) {
		const item = items[i];
		if (item.defindex === SKU.fromString(sku).defindex) {
			found = item;
			break;
		}
	}
	if (typeof found == undefined) {
		console.log('Item with defindex ' + defindex + ' is not in schema');
		return;
	}
	return {small: found.image_url, large: found.image_url_large};
};
