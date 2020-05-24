const folders = {
	config: './config',
	data: './data'
};

const files = {
	config: `${folders.config}/config.json`,
	pricelist: `${folders.data}/pricelist.json`,
	schema: `${folders.data}/schema.json`,
	polldata: `${folders.data}/polldata.json`,
	package: '../package.json'
};

module.exports = {
	folders,
	files
};
