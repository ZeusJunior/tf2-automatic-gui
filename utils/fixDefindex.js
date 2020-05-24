const { defindexes } = require('../app/data');
const _ = require('lodash');
const Schema = require('../app/schema');


module.exports = function(itemInfo) {
	if (isStockWeapon(itemInfo.schemaItem)) fixStockWeaponDefindex(itemInfo);
	else if (isFixablePromo(isPromotedItem(itemInfo.schemaItem), itemInfo.item)) fixPromoDefindex(itemInfo);
	else if (hasPaintKit(itemInfo.item) && hasAttributesAndIsNotDecorated(itemInfo)) fixWarPaintDefindex(itemInfo);
	else fixExceptionsDefindex(itemInfo);
};

// eslint-disable-next-line require-jsdoc
function hasPaintKit(item) {
	return item.paintkit != null;
}

// eslint-disable-next-line require-jsdoc
function isStockWeapon(schemaItem) {
	return schemaItem.name.indexOf(schemaItem.item_class.toUpperCase()) !== -1;
}

// eslint-disable-next-line require-jsdoc
function fixStockWeaponDefindex({ item, items, schemaItem }) {
	items.forEach((itemFromSchema) => {
		if (isUpgradableStockWeapon(schemaItem, itemFromSchema)) {
			item.defindex = itemFromSchema.defindex;
		}
	});
}

// eslint-disable-next-line require-jsdoc
function isUpgradableStockWeapon(schemaItem, itemFromSchema) {
	return itemFromSchema.item_class === schemaItem.item_class && itemFromSchema.name.startsWith('Upgradeable ');
}

// eslint-disable-next-line require-jsdoc
function fixExceptionsDefindex({ item, schemaItem }) {
	if (schemaItem.item_name === 'Mann Co. Supply Crate Key') item.defindex = defindexes['Mann Co. Supply Crate Key'];
	else if (schemaItem.item_name === 'Lugermorph') item.defindex = defindexes['Lugermorph'];
}

// eslint-disable-next-line require-jsdoc
function isFixablePromo(isPromo, { quality }) {
	return (isPromo && quality != 1) || (!isPromo && quality == 1);
}

// eslint-disable-next-line require-jsdoc
function fixPromoDefindex({ item, items, schemaItem }) {
	items.forEach((itemFromSchema) => {
		if (!isPromotedItem(itemFromSchema) && itemFromSchema.item_name == schemaItem.item_name) {
			item.defindex = itemFromSchema.defindex;
		}
	});
}

// eslint-disable-next-line require-jsdoc
function isPromotedItem(schemaItem) {
	return schemaItem.name.startsWith('Promo ') && schemaItem.craft_class == '';
}

// eslint-disable-next-line require-jsdoc
function hasAttributesAndIsNotDecorated({ item, schemaItem }) {
	return schemaItem.item_quality != 15 || !hasCorrectPaintkitAttribute(item);
}

// eslint-disable-next-line require-jsdoc
function hasCorrectPaintkitAttribute(item) {
	return Schema.getItemByDefindex(item.defindex).static_attrs !== undefined && Schema.getItemByDefindex(item.defindex).static_attrs['paintkit_proto_def_index'] == item.paintkit;
}

// eslint-disable-next-line require-jsdoc
function fixWarPaintDefindex({ item }) {
	const schema = Schema.get();
	const gameItems = schema.raw.items_game.items;
	
	_.forOwn(gameItems, (gameItem, defindex) => {
		if (!Object.prototype.hasOwnProperty.call(gameItems, defindex)) {
			return;
		}

		if (isItemPaintKit(gameItem)) {
			return;
		}

		if (doesPaintKitMatch(item, gameItem)) {
			item.defindex = parseInt(defindex);
			return;
		}
	});
}

// eslint-disable-next-line require-jsdoc
function isItemPaintKit(itemFromSchema) {
	return itemFromSchema.prefab === undefined || !itemFromSchema.prefab.startsWith('paintkit');
}

// eslint-disable-next-line require-jsdoc
function doesPaintKitMatch(item, itemFromSchema) {
	return itemFromSchema.static_attrs['paintkit_proto_def_index'] == item.paintkit;
}
