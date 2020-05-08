const Schema = require('../app/schema');
const data = require('../app/data');
const SKU = require('tf2-sku');

module.exports = getStatsLink;

/**
 * 
 * @param {(string|Object)} item - SKU or item object
 * @return {string} - Full bptf stats link
 */
function getStatsLink(item) {
	// If its a sku and not an item object
	if (typeof item === 'string') {
		item = SKU.fromString(item);
	}

	const schemaItem = Schema.getItemByDefindex(item.defindex);
	if (!schemaItem) {
		return null;
	}

	let url = 'https://backpack.tf/stats/' + data.quality[item.quality] + '/';

	if (item.festive) {
		url += 'Festivized ';
	}

	if (item.killstreak > 0) {
		url += data.killstreak[item.killstreak] + ' ';
	}

	if (item.paintkit) {
		url += data.skin[item.paintkit] + ' ';
	}

	if (item.australium) {
		url += 'Australium ';
	}

	url += schemaItem.item_name;

	if (item.wear) {
		data.wear[item.wear];
	}

	url += '/Tradable/';
	url += item.craftable ? 'Craftable/' : 'Non-Craftable/';

	if (item.effect) {
		url += item.effect;
	}

	return url;
}
