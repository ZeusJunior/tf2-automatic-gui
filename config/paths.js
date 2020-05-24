const path = require('path');

const folders = {
	data: process.env.BOT_DATA_FOLDER
};

const files = {
	pricelist: path.join(folders.data, '/pricelist.json'),
	schema: path.join(folders.data, '/schema.json'),
	polldata: path.join(folders.data, '/polldata.json'),
	package: '../package.json'
};

module.exports = {
	folders,
	files
};
