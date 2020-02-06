const Schema = require('../app/schema');

const fixDefindex = require('./fixDefindex');
const findCrateSeries = require('./findCrateSeries');
const fixQuality = require('./fixQuality');

/**
 * Fixes item.
 * @param {Object} sku
 * @return {Object} 
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
	const schemaItem = getItemByDefindex(sku.defindex);

	if (schemaItem === null) {
		return sku;
	}

	const itemInfo = {
		item: sku,
		items: Schema.get().raw.schema,
		schemaItem
	};

	fixDefindex(itemInfo);
	findCrateSeries(itemInfo);
	fixQuality(itemInfo);

	return sku;
};

function getItemByDefindex(defindex) {
	const schema = Schema.get();
	const { items } = schema.raw.schema;

	let itemMatch = null;
	items.forEach((item) => {
		if (item.defindex === defindex) {
			itemMatch = item;
		}
	});

	return itemMatch;
}
