const Schema = require('../app/schema.js');

module.exports = getDefindex;

// By item name
async function getDefindex (search) {
	const schema = await Schema.getTheFuckinSchemaVariableIHateMyLife();
	return new Promise((resolve, reject) => {
		const items = schema.raw.schema.items;
		for (let i = 0; i < items.length; i++) {
			const name = items[i].item_name;
			if (name === search || name === search.replace('The ', '')) {
				return resolve(items[i].defindex);
			}
		}

		return resolve(false);
	});
}
