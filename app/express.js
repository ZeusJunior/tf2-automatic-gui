// Handles express side of things

const path = require('path');
const express = require('express');
const app = express();
const bodyParser = require('body-parser');

// Maybe just require in the app.use instead of vars
const index = require('./routes/index');
const removeItems = require('./routes/removeItems');
const addItem = require('./routes/addItem');
const addItems = require('./routes/addItems');
const trades = require('./routes/trades');
const changeItem = require('./routes/changeItem');
const clearPricelist = require('./routes/clearPricelist');
const search = require('./routes/search');
const getItems = require('./routes/getItems');
const profit = require('./routes/profit');

app
	.use(express.static(path.join(__dirname, '../assets')))
	.set('views', path.join(__dirname, '../views'))
	.set('view engine', 'ejs')
	.use(bodyParser.json())
	.use(bodyParser.urlencoded({
		extended: false
	}));

app
	.use('/', index)
	.use('/removeItems', removeItems)
	.use('/clearPricelist', clearPricelist)
	.use('/addItem', addItem)
	.use('/addItems', addItems)
	.use('/trades', trades)
	.use('/changeItem', changeItem)
	.use('/search', search)
	.use('/getItems', getItems)
	.use('/profit', profit);

module.exports = app;
