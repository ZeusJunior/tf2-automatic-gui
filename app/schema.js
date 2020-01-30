// Modified version of https://github.com/Nicklason/tf2-automatic/blob/master/src/app/utils/item/fixItem.js
// To not use a steam api key, and a few other things

const fs = require('fs-extra');
const request = require('request-promise');
let schema;


exports.getSchema = function(callback) {
	return fs.readJSON('./config/schema.json')
		.then((schemaJSON) => {
			schema = schemaJSON;
		})
		.catch((err) => {
			throw new Error('Couldn\'t read schema: ' + err);
		});
};

exports.fetchSchema = function(callback) {
	return request(
		{
			uri: 'https://api.prices.tf/schema',
			method: 'GET',
			qs: {
				appid: 440
			},
			json: true
		}
	)
		.then(() => {
			fs.writeFileSync('./config/schema.json', JSON.stringify(body));
		})
		.catch((err) => {
			throw new Error('Couldn\'t get schema from pricestf: ' + err);
		});
};

exports.fixItem = function(item) {
	const schemaItem = getItemByDefindex(item.defindex);

	if (schemaItem === null) {
		return item;
	}

	if (schemaItem.name.indexOf(schemaItem.item_class.toUpperCase()) !== -1) {
		for (let i = 0; i < schema.raw.schema.items.length; i++) {
			if (schema.raw.schema.items[i].item_class === schemaItem.item_class && schema.raw.schema.items[i].name.startsWith('Upgradeable ')) {
				item.defindex = schema.raw.schema.items[i].defindex;
			}
		}
	}

	if (schemaItem.item_name === 'Mann Co. Supply Crate Key') {
		item.defindex = 5021;
	} else if (schemaItem.item_name === 'Lugermorph') {
		item.defindex = 160;
	}

	const isPromo = _isPromo(schemaItem);

	if (isPromo && item.quality != 1) {
		for (let i = 0; i < schema.raw.schema.items.length; i++) {
			if (!_isPromo(schema.raw.schema.items[i]) && schema.raw.schema.items[i].item_name == schemaItem.item_name) {
				// This is the non-promo version, use that defindex instead
				item.defindex = schema.raw.schema.items[i].defindex;
			}
		}
	} else if (!isPromo && item.quality == 1) {
		for (let i = 0; i < schema.raw.schema.items.length; i++) {
			if (_isPromo(schema.raw.schema.items[i]) && schema.raw.schema.items[i].item_name == schemaItem.item_name) {
				item.defindex = schema.raw.schema.items[i].defindex;
			}
		}
	}

	if (schemaItem.item_class === 'supply_crate') {
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
			const itemsGameItem = schema.raw.items_game.items[item.defindex];

			if (itemsGameItem.static_attrs !== undefined && itemsGameItem.static_attrs['set supply crate series'] !== undefined) {
				if (isObject(itemsGameItem.static_attrs['set supply crate series'])) {
					series = itemsGameItem.static_attrs['set supply crate series'].value;
				} else {
					series = itemsGameItem.static_attrs['set supply crate series'];
				}
			}
		}

		if (series !== null) {
			item.crateseries = parseInt(series);
		}
	}

	if (item.effect !== null) {
		if (item.quality === 11) {
			item.quality2 = 11;
		}

		item.quality = 5;
	} else if (item.paintkit !== null) {
		if (item.quality2 === 11) {
			item.quality = 11;
			item.quality2 = null;
		}
	}

	if (item.paintkit !== null) {
		const hasCorrectPaintkitAttribute = schema.raw.items_game.items[item.defindex].static_attrs !== undefined && schema.raw.items_game.items[item.defindex].static_attrs['paintkit_proto_def_index'] == item.paintkit;

		if (schemaItem.item_quality != 15 || !hasCorrectPaintkitAttribute) {
			for (const defindex in schema.raw.items_game.items) {
				if (!Object.prototype.hasOwnProperty.call(schema.raw.items_game.items, defindex)) {
					continue;
				}

				const itemsGameItem = schema.raw.items_game.items[defindex];
				if (itemsGameItem.prefab === undefined || !itemsGameItem.prefab.startsWith('paintkit')) {
					continue;
				}

				if (itemsGameItem.static_attrs['paintkit_proto_def_index'] == item.paintkit) {
					item.defindex = parseInt(defindex);
					break;
				}
			}
		}
	}

	return item;
};

function _isPromo(schemaItem) {
	return schemaItem.name.startsWith('Promo ') && schemaItem.craft_class == '';
}

function getItemByDefindex(defindex) {
	for (let i = 0; i < schema.raw.schema.items.length; i++) {
		const item = schema.raw.schema.items[i];
		if (item.defindex === defindex) {
			return item;
		}
	}

	return null;
}

exports.get = function() {
	return schema;
};
