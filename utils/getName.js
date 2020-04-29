const Schema = require('../app/schema');
const data = require('../app/data');
const SKU = require('tf2-sku');

module.exports = getName;

/**
 * 
 * @param {(string|Object)} item - SKU or item object
 * @param {bool} [proper=true] - If false, doesn't add "The" to the name
 * @return {string} - Item name
 */
function getName(item, proper = true) {
	// If its a sku and not an item object
	if (typeof item === 'string') {
		item = SKU.fromString(item);
	}

	const schemaItem = getItemByDefindex(item.defindex);
	if (schemaItem === null) {
		return null;
	}

	let name = '';

	if (item.tradable === false) {
		name = 'Non-Tradable ';
	}

	if (item.craftable === false) {
		name += 'Non-Craftable ';
	}

	if (item.quality2) {
		// Elevated quality
		name += data.quality[item.quality2] + ' ';
	}

	if ((item.quality !== 6 && item.quality !== 15 && item.quality !== 5) || (item.quality === 5 && !item.effect) || schemaItem.item_quality == 5) {
		// If the quality is not Unique, Decorated, or Unusual, or if the quality is Unusual but it does not have an effect, or if the item can only be unusual, then add the quality
		name += data.quality[item.quality] + ' ';
	}

	if (item.festive === true) {
		name += 'Festivized ';
	}

	if (item.effect) {
		name += data.effect[item.effect] + ' ';
	}

	if (item.killstreak && item.killstreak > 0) {
		name += ['Killstreak', 'Specialized Killstreak', 'Professional Killstreak'][item.killstreak - 1] + ' ';
	}

	if (item.target) {
		name += getItemByDefindex(item.target).item_name + ' ';
	}

	if (item.outputQuality && item.outputQuality !== 6) {
		name = data.quality[item.outputQuality] + ' ' + name;
	}

	if (item.output) {
		name += getItemByDefindex(item.output).item_name + ' ';
	}

	if (item.australium === true) {
		name += 'Australium ';
	}

	if (item.paintkit) {
		name += data.skin[item.paintkit] + ' ';
	}

	if (proper === true && name === '' && schemaItem.proper_name == true) {
		name = 'The ';
	}

	name += schemaItem.item_name;

	if (item.wear) {
		name += ' (' + ['Factory New', 'Minimal Wear', 'Field-Tested', 'Well-Worn', 'Battle Scarred'][item.wear - 1] + ')';
	}

	if (item.crateseries) {
		name += ' #' + item.crateseries;
	}

	return name;
}


/**
 * Gets the full schema item
 * @param {int} defindex 
 * @return {Object} schemaItem
 */
function getItemByDefindex(defindex) {
	const schema = Schema.get();
	
	if (!schema) {
		return null;
	}
	
	const { items } = schema.raw.schema;

	for (let i = 0; i < items.length; i++) {
		const item = items[i];
		if (item.defindex === defindex) {
			return item;
		}
	}

	return null;
}
