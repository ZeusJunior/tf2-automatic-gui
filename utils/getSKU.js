const Schema = require('../app/schema.js');
const data = require('../app/data.js');
const SKU = require('tf2-sku');
const getDefindex = require('./getDefindex');

module.exports = getSKU;


function getSKU (search) {
	return new Promise(async(resolve, reject) => {
		if (search.includes(';')) { // too lazy
			return resolve(SKU.fromObject(Schema.fixItem(SKU.fromString(search))));
		}

		const item = {
			defindex: '',
			quality: 6,
			craftable: true,
			killstreak: 0,
			australium: false,
			festive: false,
			effect: null,
			wear: null,
			paintkit: null,
			quality2: null
		};
		
		let name;

		if (search.includes('backpack.tf/stats')) { // input is a stats page URL
			searchParts = search.substring(search.indexOf('stats')).split('/');

			name = decodeURI(searchParts[2]).replace('| ', ''); // Decode and just remove | by default since bptf has that for skins, not *that* good but decent
			const quality = decodeURI(searchParts[1]);
			item.craftable = searchParts[4] === 'Craftable' ? true : false;

			if (quality == 'Strange Unusual') {
				item.quality = 5;
				item.quality2 = 11;
			} else if (quality == 'Strange Haunted') {
				item.quality = 13;
				item.quality2 = 11;
			} else {
				item.quality = data.quality[searchParts[1]];
			}

			if (item.quality == 5) {
				item.effect = parseInt(searchParts[5]);
			}
		} else { // Input is an item name
			name = search;

			// Check for quality if its not a bptf link
			if (name.includes('Strange Haunted')) {
				item.quality = 13;
				item.quality2 = 11;
			} else {
				for (i = 0; i < data.qualities.length; i++) {
					if (name.includes(data.qualities[i])) {
						name = name.replace(data.qualities[i] + ' ', '');
						item.quality = data.quality[data.qualities[i]];
						break;
					}
				}
			}

			// Check for effects if not a bptf link
			for (i = 0; i < data.effects.length; i++) {
				if (name.includes(data.effects[i])) {
					name = name.replace(data.effects[i] + ' ', '');
					item.effect = data.effect[data.effects[i]];
					// Has an effect, check if its strange. If so, set strange elevated
					if (item.quality == 11) {
						item.quality = 5;
						item.quality2 = 11;
					}
					break;
				}
			}

			// Check if craftable if not a bptf link
			if (name.includes('Non-Craftable')) {
				name = name.replace('Non-Craftable ', '');
				item.craftable = false;
			}
		}

		// Always check for wear
		for (i = 0; i < data.wears.length; i++) {
			if (name.includes(data.wears[i])) {
				name = name.replace(' ' + data.wears[i], '');
				item.wear = data.wear[data.wears[i]];
				break;
			}
		}

		// Always check for skin if it has a wear
		if (item.wear) {
			for (i = 0; i < data.skins.length; i++) {
				if (name.includes(data.skins[i])) {
					name = name.replace(data.skins[i] + ' ', '');
					item.paintkit = data.skin[data.skins[i]];
					if (item.effect) { // override decorated quality if it is unusual
						item.quality = 5;
					}
					break;
				}
			}
		}

		// Always check for killstreak
		for (i = 0; i < data.killstreaks.length; i++) {
			if (name.includes(data.killstreaks[i])) {
				name = name.replace(data.killstreaks[i] + ' ', '');
				item.killstreak = data.killstreak[data.killstreaks[i]];
				break;
			}
		}

		// Always check for Australium
		if (name.includes('Australium') && item.quality === 11) {
			name = name.replace('Australium ', '');
			item.australium = true;
		}

		// Always get defindex
		let defindex;
		if (name.includes('War Paint')) {
			defindex = 16102; // Defindexes for war paints get corrected when fixing sku
		} else {
			// TODO: Handle correctly
			defindex = await getDefindex(name);
		}

		if (defindex === false) {
			console.log('Item is not priced and couldn\'t get defindex: ' + search);
			return resolve(false);
		}

		item.defindex = defindex;
		return resolve(SKU.fromObject(Schema.fixItem(item)));
	});
}
