const Schema = require('./../app/schema');

module.exports = function({ item, schemaItem }) {
	if (!isCrate(schemaItem)) {
		return;
	}
	
	let series = null;

	if (schemaItem.attributes) {
		series = findSeriesInAtrributes(schemaItem.attributes);
	}

	if (series) {
		item.crateseries = parseInt(series);
		return;
	}

	
	const itemsGameItem = Schema.getItemByDefindex(item.defindex);

	
	if (itemsGameItem.static_attrs && itemsGameItem.static_attrs['set supply crate series'] !== undefined) {
		const seriesAttribute = itemsGameItem.static_attrs['set supply crate series'];

		series = isObject(seriesAttribute) ? seriesAttribute.value : seriesAttribute;
	}
};

// eslint-disable-next-line camelcase, require-jsdoc
function isCrate({ item_class }) {
	// eslint-disable-next-line camelcase
	return item_class === 'supply_crate';
}

// eslint-disable-next-line require-jsdoc
function findSeriesInAtrributes(attributes) {
	let series = null;
	
	attributes.forEach((attribute) => {
		if (attribute.name === 'set supply crate series') {
			series = attribute.value;
		}
	});

	return series;
}
