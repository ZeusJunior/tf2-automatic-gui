const Schema = require('../app/schema.js');
const { wear, wears, quality, qualities, effect, effects, killstreak, killstreaks, skin, skins } = require('../app/data.js');
const SKU = require('tf2-sku');
const fixItem = require('../utils/fixItem');

module.exports = getSKU;

/**
 * Generates a sku
 * @param {string} search - BPTF stats link, SKU or item name.
 * @return {string} - The generated SKU
 */
function getSKU(search) {
	if (search.includes(';')) { // too lazy
		return SKU.fromObject(
			fixItem(
				SKU.fromString(
					search
				)
			)
		);
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
		searchParts = search
			.substring(search.indexOf('stats'))
			.split('/');

		name = decodeURI(searchParts[2]).replace('| ', ''); // Decode and just remove | by default since bptf has that for skins, not *that* good but decent
		
		const urlQuality = decodeURI(searchParts[1]);
		
		item.craftable = searchParts[4] === 'Craftable' ? true : false;

		if (quality == 'Strange Unusual') {
			item.quality = 5;
			item.quality2 = 11;
		} else if (quality == 'Strange Haunted') {
			item.quality = 13;
			item.quality2 = 11;
		} else {
			item.quality = quality[urlQuality];
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
			for (i = 0; i < qualities.length; i++) {
				if (name.includes(qualities[i])) {
					name = name.replace(qualities[i] + ' ', '');
					item.quality = quality[qualities[i]];
					
					break;
				}
			}
		}

		// Check for effects if not a bptf link
		for (i = 0; i < effects.length; i++) {
			if (name.includes(effects[i])) {
				name = name.replace(effects[i] + ' ', '');
				item.effect = effect[effects[i]];
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
	for (i = 0; i < wears.length; i++) {
		if (name.includes(wears[i])) {
			name = name.replace(' ' + wears[i], '');
			item.wear = wear[wears[i]];
			
			break;
		}
	}

	// Always check for skin if it has a wear
	if (item.wear) {
		for (i = 0; i < skins.length; i++) {
			if (name.includes(skins[i])) {
				name = name.replace(skins[i] + ' ', '');
				item.paintkit = skin[skins[i]];
				
				if (item.effect) { // override decorated quality if it is unusual
					item.quality = 5;
				}
				
				break;
			}
		}
	}

	// Always check for killstreak
	for (i = 0; i < killstreaks.length; i++) {
		if (name.includes(killstreaks[i])) {
			name = name.replace(killstreaks[i] + ' ', '');
			item.killstreak = killstreak[killstreaks[i]];
			
			break;
		}
	}

	// Always check for Australium
	if (name.includes('Australium') && item.quality === 11) {
		name = name.replace('Australium ', '');
		item.australium = true;
	}

	// Always check for Festivized
	if (name.includes('Festivized')) {
		name = name.replace('Festivized ', '');
		item.festive = true;
	}

	// Always get defindex
	let defindex;
	if (name.includes('War Paint')) {
		defindex = 16102; // Defindexes for war paints get corrected when fixing sku
	} else {
		defindex = getDefindex(name);
	}

	if (defindex === false) {
		console.log('Couldn\'t get defindex for item: ' + search);
		return false;
	}

	item.defindex = defindex;
	
	return SKU.fromObject(
		fixItem(item)
	);
}

/**
 * Gets the defindex from schema for an item
 * @param {string} search - Item name without quality/effect/festivized/etc
 * @return {(int|bool)} - Found defindex, false if none is found
 */
function getDefindex(search) {
	const schema = Schema.get();
	const { items } = schema.raw.schema;
	
	for (let i = 0; i < items.length; i++) {
		// eslint-disable-next-line camelcase
		const { item_name, defindex } = items[i];

		// eslint-disable-next-line camelcase
		if (item_name === search || item_name === search.replace('The ', '')) {
			return defindex;
		}
	}

	return false;
}
