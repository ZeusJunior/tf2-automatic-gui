const Schema = require('../app/schema');
const defindexes = require('../resources/defindexes');


module.exports = function(item) {
	const schemaItem = getItemByDefindex(item.defindex);

	if (schemaItem === null) {
		return item;
	}

	const schema = Schema.get();
	const { items } = schema.raw.schema;
	const itemInfo = {
		item,
		items,
		schemaItem
	};

	if (isStockWeapon(schemaItem)) fixStockWeaponDefindex(itemInfo);
	else if (isFixablePromo(isPromo, item)) fixPromoDefindex(itemInfo);
	else if (hasPaintKit(item) && hasAttributesAndIsNotDecorated(itemInfo)) fixWarPaintDefindex(itemInfo);
	else fixExceptionsDefindex(itemInfo);

	if (isCrate(schemaItem)) fixCrate(itemInfo);

	if (hasEffect(item)) fixUnusualQuality(item);
	else if (hasPaintKit(item)) fixPaintKitQuality(item);

	return item;
};

function getItemByDefindex(defindex) {
	const schema = Schema.get();
	const { items } = schema.raw.schema;

	for (let i = 0; i < items.length; i++) {
		const item = items[i];
		
		if (item.defindex === defindex) {
			return item;
		}
	}

	return null;
}

function isStockWeapon(schemaItem) {
	return schemaItem.name.indexOf(schemaItem.item_class.toUpperCase()) !== -1;
}

function fixStockWeaponDefindex(item, items, schemaItem) {
	for (let i = 0; i < items.length; i++) {
		const itemFromSchema = items[i];

		if (isUpgradableStock(schemaItem, itemFromSchema)) {
			item.defindex = itemFromSchema.defindex;
		}
	}
}

// TODO: better naming
function isUpgradableStock(schemaItem, itemFromSchema) {
	return itemFromSchema.item_class === schemaItem.item_class && itemFromSchema.name.startsWith('Upgradeable ');
}

function fixExceptionsDefindex(item, schemaItem) {
	if (schemaItem.item_name === 'Mann Co. Supply Crate Key') item.defindex = defindexes['Mann Co. Supply Crate Key'];
	else if (schemaItem.item_name === 'Lugermorph') item.defindex = defindexes['Lugermorph'];
}

function isFixablePromo(isPromo, { quality }) {
	return (isPromo && quality != 1) || (!isPromo && quality == 1);
}

function fixPromoDefindex({ item, items, schemaItem }) {
	for (let i = 0; i < items.length; i++) {
		const itemFromSchema = items[i];

		if (!isPromotedItem(itemFromSchema) && itemFromSchema.item_name == schemaItem.item_name) {
			// This is the non-promo version, use that defindex instead
			item.defindex = itemFromSchema.defindex;
		}
	}
}

function isPromotedItem(schemaItem) {
	return schemaItem.name.startsWith('Promo ') && schemaItem.craft_class == '';
}

function hasAttributesAndIsNotDecorated({ item, items, schemaItem }) {
	return schemaItem.item_quality != 15 || !hasCorrectPaintkitAttribute(item, items);
}

function hasCorrectPaintkitAttribute({ item, items }) {
	return items[item.defindex].static_attrs !== undefined && items[item.defindex].static_attrs['paintkit_proto_def_index'] == item.paintkit;
}

function fixWarPaintDefindex({ item, items }) {
	for (const defindex in items) {
		if (!Object.prototype.hasOwnProperty.call(items, defindex)) {
			continue;
		}

		const itemsGameItem = items[defindex];
		if (itemsGameItem.prefab === undefined || !itemsGameItem.prefab.startsWith('paintkit')) {
			continue;
		}

		if (itemsGameItem.static_attrs['paintkit_proto_def_index'] == item.paintkit) {
			item.defindex = parseInt(defindex);
			break;
		}
	}
}

// eslint-disable-next-line camelcase
function isCrate({ item_class }) {
	// eslint-disable-next-line camelcase
	return item_class === 'supply_crate';
}

function fixCrate({ item, items, schemaItem }) {
	let series = null;

	if (schemaItem.attributes !== undefined) {
		for (let i = 0; i < schemaItem.attributes.length; i++) {
			const attribute = schemaItem.attributes[i];

			if (attribute.name === 'set supply crate series') {
				series = attribute.value;
			}
		}
	}

	if (series === null) {
		const itemsGameItem = items[item.defindex];

		if (itemsGameItem.static_attrs !== undefined && itemsGameItem.static_attrs['set supply crate series'] !== undefined) {
			if (isObject(itemsGameItem.static_attrs['set supply crate series'])) {
				series = itemsGameItem.static_attrs['set supply crate series'].value;
			} else {
				series = itemsGameItem.static_attrs['set supply crate series'];
			}
		}
	} else {
		item.crateseries = parseInt(series);
	}
}

function hasEffect({ effect }) {
	return effect != null;
}

function fixUnusualQuality(item) {
	if (item.quality === 11) {
		item.quality2 = 11;
	}

	item.quality = 5;
}

function hasPaintKit({ paintkit }) {
	return paintkit != null;
}

function fixPaintKitQuality(item) {
	if (item.quality2 === 11) {
		item.quality = 11;
		item.quality2 = null;
	}
}
