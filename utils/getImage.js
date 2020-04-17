const Schema = require('../app/schema');
const SKU = require('tf2-sku');
const { qualityColors } = require('../app/data');

/**
 * 
 * @param {string} sku item SKU
 * @return {Object} Item image links - {small: 'link', large: 'link'}
 */
function getImageFromSKU(sku) {
	const found = Schema.getItemBySKU(sku);
	if (typeof found == undefined) {
		console.log('Item with defindex ' + defindex + ' is not in schema');
		return;
	}
	return {small: found.image_url, large: found.image_url_large};
};
exports.getImageFromSKU = getImageFromSKU;

/**
 * generates colour for items quality
 * @param {String} sku item SKU
 * @return {Object} {color in hexadecimal string, craflable, image_url, image_url_large}
 */
exports.getImageStyle = function getImageStyle(sku) {
	const img = getImageFromSKU(sku);
	const item = SKU.fromString(sku);
	return {
		quality_color: qualityColors[item.quality],
		border_color: (item.quality2 != null) ? qualityColors[item.quality2] : '#000000',
		craftable: item.craftable,
		image_small: img.small,
		image_large: img.large};
};
