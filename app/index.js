'use strict';

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const fs = require('fs-extra');
const Schema = require('./schema');
const app = require('./express');

const paths = require('../config/paths');

console.log('tf2-automatic-gui v' + require(paths.files.package).version + ' is starting...');


if (!fs.existsSync(paths.files.pricelist)) {
	throw new Error('Missing pricelist - Please put your pricelist file in the config folder');
}


Schema.init()
	.then(() => {
		app.listen(3000, function() {
			console.log('listening on port 3000');
		});
	})
	.catch((err) => {
		throw err;
	});


process
	.on('uncaughtException', (err) => {
		console.log('Received an uncaugh error.');
		console.log(`Error message: ${err.message}`);
		console.log(`Error stack: ${err.stack}`);
		console.log('Please report this bug @ https://github.com/ZeusJunior/tf2-automatic-gui/issues/new');
	})
	.on('unhandledRejection', (reason, p) => {
		console.log('Received an unhandled rejection.');
		console.log(p);
		console.log('Please report this @ https://github.com/ZeusJunior/tf2-automatic-gui/issues/new');
	});
