const path = require('path')

const folders = {
	config: './config',
	data: '../data'
};

const files = {
	pricelist: path.join(__dirname, folders.data, 'pricelist.json'),
	config: path.join(__dirname, 'config.json'),
	schema: path.join(__dirname, folders.data, 'schema.json'),
	polldata: path.join(__dirname, folders.data, 'polldata.json'),
	package: path.join(__dirname, '../package.json')
};

module.exports = {
	folders,
	files
};
