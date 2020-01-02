const path = require('path');
const express = require('express');
const app = express();
const bodyParser = require('body-parser');
const utils = require('./utils.js');
const fs = require('fs');

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
    res.render('home');
})

app.get('/add-item', (req, res) => {
    res.render('addItem', {
        type: 'primary',
        msg: 'none'
    });
});
app.post('/add-item', async (req, res) => {
    if (req.body.input.includes('classifieds')) {
        res.render('addItem', {
            type: 'danger',
            msg: 'Please use the items stats page, not the classifieds link'
        });
        return;
    }
    if (!req.body.input.includes('backpack.tf/stats')) {
        res.render('addItem', {
            type: 'danger',
            msg: 'It is currently not possible to add items by name, please use the items stats page instead'
        });
        return;
    }
    let addItem = await utils.addItem(req.body.input);
    if (addItem == false) {
        res.render('addItem', {
            type: 'danger',
            msg: 'Something went wrong. Either the item is not autopriced, or it was not possible to update your pricelist'
        });
        return;
    }
    if (addItem == 'alreadyAdded') {
        res.render('addItem', {
            type: 'danger',
            msg: 'This item is already in your pricelist'
        });
        return;
    }
    res.render('addItem', {
        type: 'success',
        msg: 'Success! The item was added successfully'
    });
});

app.get('/pricelist', (req, res) => {
    fs.readFile('./config/pricelist.json', function (err, data) {
        if (err) throw err;
        res.render('pricelist', {
            type: 'primary',
            msg: 'none',
            pricelist: JSON.parse(data)
        });
    });
});
app.post('/pricelist', async (req, res) => {
    const items = req.body.list
    let removed = await utils.removeItems(items);
    if (removed == false) {
        fs.readFile('./config/pricelist.json', function (err, data) {
            if (err) throw err;
            res.render('pricelist', {
                type: 'danger',
                msg: 'Somehow not able to remove items!',
                pricelist: JSON.parse(data)
            });
            return;
        });
    }
    fs.readFile('./config/pricelist.json', function (err, data) {
        if (err) throw err;
        res.render('pricelist', {
            type: 'success',
            msg: 'Removed ' + removed + ' items from your pricelist',
            pricelist: JSON.parse(data)
        });
    });
});

app.listen(3000, function() { //listen on port 3000
    console.log("listening on port 3000");
    require("open")("http://localhost:3000/");
});