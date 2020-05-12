const Schema = require('../server/schema');
const { wear, wears, quality, qualities, effect, effects, killstreak, killstreaks, skin, skins, qualityColors } = require('../server/data.js');
const fixItem = require('./fixItem');
const getName = require('./getName');
const SKU = require('tf2-sku');
const Fuse = require('fuse.js');

module.exports = function(search, maxResults) {
	const schema = Schema.get();
	const item = parseSearch(search);
	const matches = [];
	if (!schema) {
		return matches;
	}

	if (item.defindex !== false) { // item is war paint
		matches.push( createMatch(item, Schema.getItemByDefindex(item.defindex)) );
		return matches;
	}
	if (item.search == '') {
		return [];
	}
	const { items } = schema.raw.schema;

	
	let matchCount = 0;
	const matchSchemaItems = [];
	for (let i = 0; i < items.length; i++) {
		const schemaItem = items[i];
		if (doesSearchMatch(item.search, schemaItem)) {
			const match = createMatch(item, schemaItem);
			if (match.defindex != schemaItem.defindex) continue; // this item was fixed to other defindex so skip otherwise there might be multiple matches of the same item
			if (schemaItem.item_quality == 15) continue; // TODO: take a look into this
			matches.push(match);
			matchSchemaItems.push(schemaItem);
			matchCount++;
			// if (matchCount >= maxResults) break;
		}
	}
	const final = [];
	if (matchCount === 0) { // nothing found, try fuzzy search
		const fuse = new Fuse(items, {
			findAllMatches: true,
			includeScore: true,
			distance: 1000,
			keys: ['item_name']
		});
		const fuseMatches = fuse.search(item.search);
		matchCount = 0;
		for (let i = 0; i < fuseMatches.length; i++) {
			const match = createMatch(item, fuseMatches[i].item);
			if (match.defindex != fuseMatches[i].item.defindex || fuseMatches[i].item.item_quality == 15) { // prevent multiple matches of the same item TODO: same as before
				fuseMatches.splice(i, 1);// remove current element
				i--;
				continue; // this item was fixed to other defindex so skip otherwise there might be multiple matches of the same item
			}
			if (i >= maxResults) break;
			final.push(match);
		}
	} else {
		const fuse = new Fuse(matchSchemaItems, {
			findAllMatches: true,
			includeScore: true,
			distance: 1000,
			keys: ['item_name']
		});
		const fuseMatches = fuse.search(item.search);
		matchCount = 0;
		for (let i = 0; i < fuseMatches.length; i++) {
			if (i >= maxResults) break;
			final.push(matches[fuseMatches[i].refIndex]);
		}
	}
	
	
	return final;
};

/**
 * 
 * Matches items based of search indexing
 * @param {string} search 
 * @param {object} item
 * @return {boolean} 
 */
function doesSearchMatch(search, item) {
	return item.item_name.toLowerCase().indexOf(search.toLowerCase()) > -1;
};

/**
 * 
 * @param {Object} item item object
 * @param {Object} schemaItem item from schema
 * @return {Object} match object
 */
function createMatch(item, schemaItem) {
	item.defindex = schemaItem.defindex; // asign defindex of found item
	fixItem(item); // fix item with found defindex
	return match = { // this object is like getImageStyle with name and defindex to be used as ID with vue.js
		defindex: item.defindex,
		quality_color: qualityColors[item.quality],
		border_color: (item.quality2 != null) ? qualityColors[item.quality2] : '#000000',
		craftable: item.craftable,
		name: getName(item),
		craftable: item.craftable,
		image_small: schemaItem.image_url,
		image_large: schemaItem.image_url_large,
		sku: SKU.fromObject(item)
	};
}

/**
 * get quality and craftability from item
 * @param {String} search seach string
 * @return {Object} returns item object
 */
function parseSearch(search) {
	if (search.includes(';')) { // too lazy
		return SKU.fromString(search);
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
	
	let name = search;
	let index = -1;
	// Check for quality if its not a bptf link
	if (includes(name, 'Strange Haunted') > -1) {
		item.quality = 13;
		item.quality2 = 11;
	} else {
		for (i = 0; i < qualities.length; i++) {
			if ( ( index = includes(name, qualities[i]) ) > -1) {
				name = splice(name, index, qualities[i].length).trim();
				item.quality = quality[qualities[i]];
				break;
			}
		}
	}

	// Check for effects if not a bptf link
	for (i = 0; i < effects.length; i++) {
		if ( ( index = includes(name, effects[i]) ) > -1) {
			name = splice(name, index, effects[i].length).trim();
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
	if ( ( index = includes(name, 'Non-Craftable') ) > -1) {
		name = splice(name, index, 'Non-Craftable'.length).trim();
		item.craftable = false;
	}

	// Always check for wear
	for (i = 0; i < wears.length; i++) {
		if ( ( index = includes(name, wears[i]) ) > -1) {
			name = splice(name, index-1, wears[i].length).trim();
			item.wear = wear[wears[i]];
			break;
		}
	}

	// Always check for skin if it has a wear
	if (item.wear) {
		for (i = 0; i < skins.length; i++) {
			if ( ( index = includes(name, skins[i]) ) > -1) {
				name = splice(name, index, skins[i].length).trim();
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
		if ( ( index = includes(name, killstreaks[i]) ) > -1) {
			name = splice(name, index, killstreaks[i].length).trim();
			item.killstreak = killstreak[killstreaks[i]];
			break;
		}
	}

	// Always check for Australium
	if ( ( index = includes(name, 'Australium') ) > -1 && item.quality === 11) {
		name = splice(name, index, 'Australium'.length).trim();
		item.australium = true;
	}

	// Always check for Festivized
	if ( ( index = includes(name, 'Festivized') ) > -1) {
		name = splice(name, index, 'Festivized'.length).trim();
		item.festive = true;
	}

	let defindex;
	if ( ( index = includes(name, 'War Paint') ) > -1) {
		defindex = 16102; // Defindexes for war paints get corrected when fixing sku
	} else {
		defindex = false;
	}

	// remove the from search
	if ( ( index = includes(name, 'The') ) > -1) {
		name = splice(name, index, 'The'.length).trim();
	}
	item.defindex = defindex;
	item.search = name.trim(); // search without parsed things
	return item;
}

/**
 * 
 * @param {String} a
 * @param {String} b
 * @return {Number}	index of b in a
 */
function includes(a, b) {
	return a.toLowerCase().indexOf(b.toLowerCase());
}


/**
 * 
 * @param {String} str string to splice
 * @param {Number} index where to start
 * @param {Number} count how many characters to remove
 * @return {String} spliced string
 */
function splice(str, index, count) {
	return str.slice(0, index) + str.slice(index + count);
}
