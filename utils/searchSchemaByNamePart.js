const Schema = require('../app/schema');

module.exports = function(search) {
	const schema = Schema.get();
	const { items } = schema.raw.schema;

	const matches = [];

	items.forEach((item) => {
		if (item.name.toLowerCase().indexOf(search.toLowerCase()) > -1 ) {
			matches.push(item);
		}
	});

	return matches;
};
