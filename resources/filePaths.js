module.exports = {
	folders: {
		config: './config'
	},
	files: {
		pricelist: `${module.exports.folders.config}/pricelist.json`,
		config: `${module.exports.folders.config}/config.json`,
		schema: `${module.exports.folders.config}/schema.json`,
		package: '../package.json'
	}
};
