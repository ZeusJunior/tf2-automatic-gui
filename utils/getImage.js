const Schema = require('../app/schema');
const SKU = require('tf2-sku');
const { qualityColors, paintCanColors } = require('../app/data');

/**
 * 
 * @param {string} sku item SKU
 * @return {Object} Item image links - {small: 'link', large: 'link'}
 */
function getImageFromSKU(sku) {
	const item = SKU.fromString(sku);
	const found = {};
	Object.assign(found, Schema.getItemBySKU(sku)); // this is here to copy object instead of copying reference to object in schema
	if (!found) {
		console.log('Item with defindex ' + defindex + ' is not in schema');
		return;
	}
	if ((Object.keys(paintCanColors).indexOf(sku)) > -1) {
		found.image_url = found.image_url_large = `https://backpack.tf/images/440/cans/Paint_Can_${paintCanColors[sku]}.png`;
	} else if (item.paintkit !== null ) {
		found.image_url = found.image_url_large = `https://scrap.tf/img/items/warpaint/${encodeURIComponent(found.item_name)}_${item.paintkit}_${item.wear}_${item.festive===true?1:0}.png`;
	} else if (item.australium === true) {
		found.image_url = found.image_url_large = `https://scrap.tf/img/items/440/${found.defindex}-gold.png`;
	}
	return {
		small: found.image_url,
		large: found.image_url_large,
		effect: item.effect ? `https://backpack.tf/images/440/particles/${item.effect}_188x188.png` : ''
	};
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
	const ks = [
		'', // no killstreak
		'KS',
		'SPEC KS',
		'PRO KS'
	];
	return {
		quality_color: qualityColors[item.quality],
		border_color: (item.quality2 != null) ? qualityColors[item.quality2] : '#000000',
		craftable: item.craftable,
		image_small: img.small,
		image_large: img.large,
		effect: img.effect,
		killstreak: ks[item.killstreak]
	};
};
