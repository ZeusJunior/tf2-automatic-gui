const Schema = require('../app/schema');

module.exports = function(search) {
	const schema = Schema.get();

	const matches = [];
	if (!schema) {
		return matches;
	}

	const { items } = schema.raw.schema;

	items.forEach((item) => {
		if (item.name.toLowerCase().indexOf(search.toLowerCase()) > -1 ) {
			matches.push(item);
		}
	});

	return matches;
};
