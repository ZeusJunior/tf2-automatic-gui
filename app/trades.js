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
				date: getDate(offer.finishTimestamp)
			};
			trades.push(data);
		}

		callback(null, trades);
	});
};

function getDate(unix) {
	const date = new Date(unix);
	const year = date.getFullYear();
	const month = ('0' + (date.getMonth() + 1)).slice(-2);
	const hour = ('0' + date.getHours()).slice(-2);
	const day = ('0' + (date.getDate() + 1)).slice(-2);
	const minute = date.getMinutes();

	const time = year + '-' + month + '-' + day + ' ' + hour + ':' + minute;

	return time;
}
