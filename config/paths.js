const path = require('path');

const folders = {
	config: './config',
	data: process.env.BOT_DATA_FOLDER
};

const files = {
	config: path.join(folders.config, '/config.json'),
	pricelist: path.join(folders.data, '/pricelist.json'),
	schema: path.join(folders.data, '/schema.json'),
	polldata: path.join(folders.data, '/polldata.json'),
	package: '../package.json'
};

module.exports = {
	folders,
	files
};
