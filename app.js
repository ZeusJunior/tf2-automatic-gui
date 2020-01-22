console.log("tf2-automatic-gui v" + require('./package.json').version + " is starting...")
const path = require('path');
const express = require('express');
const app = express();
const bodyParser = require('body-parser');
const utils = require('./utils.js');
const fs = require('fs');
const Schema = require('./schema.js');

if (!fs.existsSync('./config/pricelist.json')) {
	throw new Error('Missing pricelist - Please put your pricelist file in the config folder')
}

app.use(express.static(path.join(__dirname, '/assets')));

app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
    extended: false
}));

app.get('/', (req, res) => {
    utils.renderPricelist(res, 'primary', 'none');
})

app.post('/add-item', async (req, res) => {
    req.body.input = req.body.input.split(/\r?\n/);
    req.body.input.forEach(function(item, index) {
        if (req.body.max - req.body.min < 1) {
            utils.renderPricelist(res, 'warning', 'The maximum stock must be atleast one higher than the minimum');
            return;
        }

        if (item.includes('classifieds')) {
            utils.renderPricelist(res, 'danger', 'Please use the items stats page or full name, not the classifieds link');
            return;
        }
    })
    
    utils.addItem(res, req.body.input, {
        intent: parseInt(req.body.intent),
        min: parseInt(req.body.min),
        max: parseInt(req.body.max)
    });
});

app.post('/pricelist', async (req, res) => {
    const items = req.body.list
    let removed = await utils.removeItems(items);
    if (removed == false) {
        utils.renderPricelist(res, 'danger', 'Somehow not able to remove items!');
        return;
    }
    utils.renderPricelist(res, 'success', 'Removed ' + removed + (removed == 1 ? ' item' : ' items') + ' from your pricelist');
    return;
});

app.post('/clearPricelist', (req, res) => {
    utils.clearPricelist(res);
})

if (fs.existsSync('./config/schema.json')) {
    Schema.getSchema(function(err, schema) { // For setting the schema in schema.js
        app.listen(3000, function() { //listen on port 3000
            console.log("listening on port 3000");
            require("open")("http://localhost:3000/");
        });
    })
} else {
    Schema.getSchemaFromApi(function(err, schema) {
        fs.writeFileSync('./config/schema.json', JSON.stringify(schema));
        app.listen(3000, function() { //listen on port 3000
            console.log("listening on port 3000");
            require("open")("http://localhost:3000/");
        });
    })
}