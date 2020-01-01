const path = require('path');
const express = require('express');
const app = express();
const bodyParser = require('body-parser');
const utils = require('./utils.js');
const fs = require('fs');

if (!fs.existsSync('./config/pricelist.json')) {
	throw new Error('Missing pricelist - Please put your pricelist file in the config folder')
}
const pricelist = require('./config/pricelist.json');

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
app.post('/add-item', (req, res) => {
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
    let addItem = utils.addItem(req.body.input);
    if (addItem == false) {
        res.render('addItem', {
            type: 'danger',
            msg: 'Something went wrong'
        });
        return;
    }
    res.render('addItem', {
        type: 'success',
        msg: 'Success! The item was added successfully'
    });
});

app.get('/pricelist', (req, res) => {
    res.render('pricelist', {
        pricelist: pricelist
    });
});

app.listen(3000, function() { //listen on port 3000
    console.log("listening on port 3000");
    require("open")("http://localhost:3000/");
});