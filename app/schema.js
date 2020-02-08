const fs = require('fs-extra');
const request = require('request-promise');

const paths = require('../resources/paths');


let schema;
exports.init = function() {
	const method = fs.existsSync(paths.files.schema) ? getSchema : fetchSchema;

	return method()
		.then((responseSchema) => {
			schema = responseSchema;
		});
};

/**
 * Gets schema from file
 * @return {Object} schema
 */
function getSchema() {
	return fs.readJSON(paths.files.schema)
		.catch((err) => {
			return Promise.reject(
				new Error('Couldn\'t read schema file: ' + err.message)
			);
		});
};

/**
 * Gets schema from API
 * @return {Object} schema
 */
function fetchSchema() {
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
		.then((body) => {
			fs.writeFileSync(paths.files.schema, JSON.stringify(body));
		})
		.catch((err) => {
			return Promise.reject(
				new Error('Couldn\'t get schema from prices.tf API: ' + err.message)
			);
		});
};

exports.get = function() {
	return schema;
};
