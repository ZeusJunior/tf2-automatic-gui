const express = require('express');
const router = express.Router();
const renderPricelist = require('../../utils/renderPricelist');

router.get('/', (req, res) => {
	const removed = parseInt(req.query.removed);

	const renderInfo = {
		res,
		type: 'primary',
		message: 'none',
		failedItems: []
	};

	if (removed == 0) {
		renderInfo.type = 'danger';
		renderInfo.message = 'Somehow not able to remove items!';
	} else if (removed) {
		renderInfo.type = 'success';
		renderInfo.message = 'Removed ' + removed + (removed == 1 ? ' item' : ' items') + ' from your pricelist';
	}

	renderPricelist(renderInfo);
});

module.exports = router;
