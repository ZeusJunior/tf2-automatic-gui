const fs = require('fs-extra');
const Schema = require('./schema');
const app = require('./express');


console.log('tf2-automatic-gui v' + require('../package.json').version + ' is starting...');


if (!fs.existsSync('./config/pricelist.json')) {
	throw new Error('Missing pricelist - Please put your pricelist file in the config folder');
}


/* App starts here: */
const schemaMethod = fs.existsSync('./config/schema.json') ? 'getSchema' : 'fetchSchema';

Schema[schemaMethod]((err, schema) => {
	if (err) {
		throw new Error('Error while getting schema.');
	}

	app.listen(3000, function() {
		console.log('listening on port 3000');
		require('open')('http://localhost:3000/');
	});
});
