'use strict';

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const fs = require('fs-extra');
const Schema = require('./schema');
const app = require('./express');
let port = process.env.PORT ? process.env.PORT : 3000;

const paths = require('../config/paths');

console.log('tf2-automatic-gui v' + require(paths.files.package).version + ' is starting...');


if (!fs.existsSync(paths.files.pricelist)) {
	throw new Error('Missing pricelist - Please put your pricelist file in the config folder');
}

if (isNaN(+port)) {
	console.log(`WARNING: You've set port to a non-number, resetting to port 3000.`);
	port = 3000;
}

Schema.init()
	.then(() => {
		app.listen(+port, function() {
			console.log(`listening on port ${port}`);
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
