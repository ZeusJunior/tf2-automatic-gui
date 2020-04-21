const Schema = require('../app/schema');
const SKU = require('tf2-sku');
const { qualityColors } = require('../app/data');

/**
 * 
 * @param {string} sku item SKU
 * @return {Object} Item image links - {small: 'link', large: 'link'}
 */
function getImageFromSKU(sku) {
	const item = SKU.fromString(sku);
	const found = Schema.getItemBySKU(sku);
	if (typeof found == undefined) {
		console.log('Item with defindex ' + defindex + ' is not in schema');
		return;
	}
	if (item.paintkit !== null ) {
		const link = `https://scrap.tf/img/items/warpaint/${found.item_name}_${item.paintkit}_${item.wear}_${item.festive===true?1:0}.png`;
		return {small: link, large: link};
	} else if (item.australium === true) {
		const link = `https://scrap.tf/img/items/440/${found.defindex}-gold.png`;
		return {small: link, large: link};
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
