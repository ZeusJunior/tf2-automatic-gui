const Schema = require('../server/schema');

const fixDefindex = require('./fixDefindex');
const findCrateSeries = require('./findCrateSeries');
const fixQuality = require('./fixQuality');

/**
 * Fixes item.
 * @param {Object} sku
 * @return {Object} - Fixed item object
 */
module.exports = function(sku) {
	/**
	 * Naming
	 * item
	 * items
	 * schemaItem
	 * itemFromSchema
	 * gameItem
	 * gameItems
	 */
	const schemaItem = Schema.getItemByDefindex(sku.defindex);

	if (schemaItem === null) {
		return sku;
	}

	const itemInfo = {
		item: sku,
		items: Schema.get().raw.schema.items,
		schemaItem
	};

	fixDefindex(itemInfo);
	findCrateSeries(itemInfo);
	fixQuality(itemInfo);

	return sku;
};
