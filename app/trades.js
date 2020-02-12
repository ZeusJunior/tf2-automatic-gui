/* eslint-disable require-jsdoc */
const fs = require('fs');
const paths = require('../resources/paths');

exports.getTrades = function(callback) {
	fs.readFile(paths.files.polldata, function(err, data) {
		if (err) {
			callback(err);
			return;
		}
		const polldata = JSON.parse(data);
		
		const trades = [];
		// eslint-disable-next-line guard-for-in
		for (offerid in polldata.offerData) {
			const offer = polldata.offerData[offerid];
			const accepted = offer.isAccepted ? 'Yes' : 'No';
			const data = {
				id: offerid,
				partner: offer.partner,
				accepted: accepted,
				time: getDate(offer.finishTimestamp)
			};
			trades.push(data);
		}

		callback(null, trades);
	});
};

function getDate(unix) {
	const date = new Date(unix);
	const year = date.getFullYear();
	const month = date.getMonth() + 1;
	const hour = date.getHours() + 24 % 12 || 12;
	const day = date.getDate();
	const minute = date.getMinutes();

	const time = year + '-' + month + '-' + day + ' ' + hour + ':' + minute;

	return time;
}
