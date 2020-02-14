const fs = require('fs-extra');
const axios = require('axios');

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
	return axios(
		{
			url: 'https://api.prices.tf/schema',
			method: 'GET',
			params: {
				appid: 440
			},
			json: true
		}
	)
		.then((response) => {
			fs.writeJSON(paths.files.schema, response.data);
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
