const express = require('express');
const router = express.Router();
const paths = require('../../resources/paths');
const fs = require('fs-extra');
const getName = require('../../utils/getName');
const getImage = require('../../utils/getImage');

router.get('/', (req, res) => {
	fs.readJSON(paths.files.pricelist)
		.then((pricelist) => {
			for (i = 0; i < pricelist.length; i++) {
				const item = pricelist[i];
				if (!item.name) {
					item.name = getName(item.sku);
				}
				item.style = getImage.getImageStyle(item.sku);
			}
			res.json({
				pricelist
			});
		})
		.catch((err) => {
			throw err;
		});
});

module.exports = router;
