// Modified version of https://github.com/Nicklason/tf2-automatic/blob/master/src/app/utils/item/fixItem.js
// To not use a steam api key, and a few other things

const fs = require('fs-extra');
const request = require('request-promise');

const paths = require('../resources/filePaths');

let schema;


exports.getSchema = function() {
	return fs.readJSON(paths.files.config)
		.then((schemaJSON) => {
			schema = schemaJSON;
		})
		.catch((err) => {
			throw new Error('Couldn\'t read schema: ' + err);
		});
};

exports.fetchSchema = function() {
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
			fs.writeFileSync(paths.files.config, JSON.stringify(body));
		})
		.catch((err) => {
			throw new Error('Couldn\'t get schema from pricestf: ' + err);
		});
};

exports.get = function() {
	return schema;
};
