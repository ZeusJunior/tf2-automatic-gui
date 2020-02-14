const Schema = require('../app/schema');

module.exports = function(search) {
	const schema = Schema.get();

	const matches = [];
	if (!schema) {
		return matches;
	}

	const { items } = schema.raw.schema;

	items.forEach((item) => {
		if (doesSearchMatch(search, item)) {
			matches.push(item);
		}
	});

	return matches;
};

/**
 * Matches items based of search indexing
 * @param {string} search 
 * @param {object} item
 * @return {boolean} 
 */
function doesSearchMatch(search, item) {
	return item.name.toLowerCase().indexOf(search.toLowerCase()) > -1;
};
