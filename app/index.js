'use strict';

const fs = require('fs-extra');
const Schema = require('./schema');
const app = require('./express');

const paths = require('../resources/filePaths');

console.log('tf2-automatic-gui v' + require(paths.files.package).version + ' is starting...');


if (!fs.existsSync(paths.files.pricelist)) {
	throw new Error('Missing pricelist - Please put your pricelist file in the config folder');
}


/* App starts here: */
const schemaMethod = fs.existsSync(paths.files.schema) ? 'getSchema' : 'fetchSchema';

Schema[schemaMethod]()
	.then(() => {
		app.listen(3000, function() {
			console.log('listening on port 3000');
			require('open')('http://localhost:3000/');
		});
	});
