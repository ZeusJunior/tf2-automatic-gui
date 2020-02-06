const defindexes = require('../resources/defindexes');
const _ = require('lodash');


module.exports = function(itemInfo) {
	if (isStockWeapon(itemInfo.schemaItem)) fixStockWeaponDefindex(itemInfo);
	else if (isFixablePromo(isPromotedItem(itemInfo.schemaItem), itemInfo.item)) fixPromoDefindex(itemInfo);
	else if (hasPaintKit(itemInfo.item) && hasAttributesAndIsNotDecorated(itemInfo)) fixWarPaintDefindex(itemInfo);
	else fixExceptionsDefindex(itemInfo);
};

function hasPaintKit(item) {
	return item.paintkit != null;
}

function isStockWeapon(schemaItem) {
	return schemaItem.name.indexOf(schemaItem.item_class.toUpperCase()) !== -1;
}

function fixStockWeaponDefindex(item, items, schemaItem) {
	items.forEach((itemFromSchema) => {
		if (isUpgradableStockWeapon(schemaItem, itemFromSchema)) {
			item.defindex = itemFromSchema.defindex;
		}
	});
}

function isUpgradableStockWeapon(schemaItem, itemFromSchema) {
	return itemFromSchema.item_class === schemaItem.item_class && itemFromSchema.name.startsWith('Upgradeable ');
}

function fixExceptionsDefindex({ item, schemaItem }) {
	if (schemaItem.item_name === 'Mann Co. Supply Crate Key') item.defindex = defindexes['Mann Co. Supply Crate Key'];
	else if (schemaItem.item_name === 'Lugermorph') item.defindex = defindexes['Lugermorph'];
}

function isFixablePromo(isPromo, { quality }) {
	return (isPromo && quality != 1) || (!isPromo && quality == 1);
}

function fixPromoDefindex({ item, items, schemaItem }) {
	items.forEach((itemFromSchema) => {
		if (!isPromotedItem(itemFromSchema) && itemFromSchema.item_name == schemaItem.item_name) {
			item.defindex = itemFromSchema.defindex;
		}
	});
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

function fixWarPaintDefindex({ item }) {
	const schema = Schema.get();
	const gameItems = schema.raw.items_game.items;
	
	_.forOwn(gameItems, (gameItem, defindex) => {
		if (!paintKits.hasOwnProperty(defindex)) {
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

function isItemPaintKit(itemFromSchema) {
	return itemFromSchema.prefab === undefined || !itemFromSchema.prefab.startsWith('paintkit');
}

function doesPaintKitMatch(item, itemFromSchema) {
	return itemFromSchema.static_attrs['paintkit_proto_def_index'] == item.paintkit;
}
