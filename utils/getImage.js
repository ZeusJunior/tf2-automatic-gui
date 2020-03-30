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
		console.log('Item with defindex ' + defindex + ' is not in schema');
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

/**
 * generates colour for items quality
 * @param {String} sku item SKU
 * @return {String} color in hexadecimal string
 */
exports.getQualityColor = function getQualityColor(sku) {
	const qualityColors = {
		0: '#B2B2B2',
		1: '#4D7455',
		2: '#8D834B',
		3: '#476291',
		4: '#70550F',
		5: '#8650AC',
		6: '#FFD700',
		7: '#70B04A',
		8: '#A50F79',
		9: '#70B04A',
		11: '#CF6A32',
		12: '#8650AC',
		13: '#38F3AB',
		14: '#AA0000',
		15: '#FAFAFA'
	};
	
	
	return qualityColors[SKU.fromString(sku).quality];
};
