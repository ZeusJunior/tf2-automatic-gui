const folders = {
	config: './config'
};

const files = {
	pricelist: `${folders.config}/pricelist.json`,
	config: `${folders.config}/config.json`,
	schema: `${folders.config}/schema.json`,
	polldata: `${folders.config}/polldata.json`,
	package: '../package.json'
};

module.exports = {
	folders,
	files
};
