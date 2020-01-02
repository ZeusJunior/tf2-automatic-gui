const Schema = require('./schema.json');
const data = require('./data.js');
const SKU = require('tf2-sku');
const request = require('request');
const fs = require('fs');

exports.addItem = function(search, options) {
    for (i = 0; i < search.length; i++) {
        setTimeout(function(i) {
            return new Promise((resolve, reject) => {
                let sku;
                if (search[i].includes(';')) { // too lazy
                    sku = search[i];
                } else {
                    sku = getSKU(search[i]);
                }
                const item = {
                    sku: '', 
                    enabled: true, 
                    autoprice: true, 
                    max: 1, 
                    min: 0, 
                    intent: 2, 
                    name: "",
                    buy: {},
                    sell: {},
                    time: 0
                }
                if (sku == false) {
                    return resolve(false);
                }
                item.sku = sku;
        
                getInfo(sku).then((info) => {
                    if (!info) return resolve(false);
                    item.name = info.name;
                    item.buy = info.buy;
                    item.sell = info.sell;
                    item.time = info.time;
        
                    item.max = options.max;
                    item.min = options.min;
                    item.intent = options.intent;
                    changePricelist('add', item).then((result) => {
                        if (!result) return resolve(false);
                        if (result == 'alreadyAdded') return resolve(result);
                        return resolve(true);
                    }).catch((err) => {
                        console.log(err);
                        return reject(err);
                    })
                }).catch((err) => {
                    console.log(err);
                    return reject(err);
                });
            });
        }, 75 * i, i) // ~13 per second
    }
} 

exports.removeItems = function(items) {
    return new Promise((resolve, reject) => {
        if (items.length == 0) {
            return resolve(false)
        }
        changePricelist('remove', items).then((result) => {
            if (!result) return resolve(false);
            return resolve(result);
        }).catch((err) => {
            console.log(err);
            return reject(err);
        })
    })
}

function getSKU (search) { 
    const item = {
        defindex: '', 
        quality: 6, 
        craftable: true, 
        killstreak: 0, 
        australium: false, 
        festive: false, 
        effect: null,
        wear: null, 
        paintkit: null, 
        quality2: null 
    };
    if (search.includes('backpack.tf/stats')) { // input is a stats page URL
        search = search.substring(search.indexOf("stats")).split('/');

        let name = decodeURI(search[2]);

        for (i = 0; i < data.killstreaks.length; i++) {
            if (name.includes(data.killstreaks[i])) {
                name = name.replace(data.killstreaks[i] + ' ', "");
                item.killstreak = data.killstreak[data.killstreaks[i]];
            }
        }
        if (name.includes('Australium') && search[1] === 'Strange') {
            name = name.replace('Australium ', "");
            item.australium = true;
        }
        if (search[1] === 'Unusual') {
            item.effect = parseInt(search[5]);
        }
        let defindex = getDefindex(name)
        if (defindex === false) {
            return false;
        }
        item.defindex = defindex;
        item.quality = data.quality[search[1]];
        item.craftable = search[4] === 'Craftable' ? true : false;
        return SKU.fromObject(item);
    }
    // handle item name inputs
    let name = search;
    if (name.includes('Non-Craftable')) {
        name = name.replace('Non-Craftable ', "");
        item.craftable = false;
    }
    for (i = 0; i < data.qualities.length; i++) {
        if (name.includes(data.qualities[i])) {
            name = name.replace(data.qualities[i] + ' ', "");
            item.quality = data.quality[data.qualities[i]];
        }
    }
    for (i = 0; i < data.effects.length; i++) {
        if (name.includes(data.effects[i])) {
            name = name.replace(data.effects[i] + ' ', "");
            item.effect = data.effect[data.effects[i]];
        }
    }
    for (i = 0; i < data.killstreaks.length; i++) {
        if (name.includes(data.killstreaks[i])) {
            name = name.replace(data.killstreaks[i] + ' ', "");
            item.killstreak = data.killstreak[data.killstreaks[i]];
        }
    }
    if (name.includes('Australium')) {
        name = name.replace('Australium ', "");
        item.australium = true;
    }
    let defindex = getDefindex(name)
    if (defindex === false) {
        return false;
    }
    item.defindex = defindex;
    return SKU.fromObject(item);
}

function getDefindex(search) {
    const items = Schema.schema.items;
    for (let i = 0; i < items.length; i++) {
        let name = items[i].item_name;
        if (name === search) {
            return items[i].defindex;
        }
    }
    return false;
}

function getInfo(sku) {
    return new Promise((resolve, reject) => {
        request({
            method: "GET",
            json: true,
            uri: "https://api.prices.tf/items/" + sku,
            qs: {
                src: 'bptf'
            }
        }, function(err, response, body) {
            if (err) {
                return reject(err);
            }
            if (body.success == false) {
                return resolve(false);
            }
            return resolve(body);
        });
    });
}

function changePricelist(action, item) {
    return new Promise((resolve, reject) => {
        if (action == 'add') {
            fs.readFile('./config/pricelist.json', function(err, data) {
                if (err) {
                    return reject(err);
                }
                let pricelist = JSON.parse(data);
                for (i = 0; i < pricelist.length; i++) {
                    if (pricelist[i].sku == item.sku) {
                        return resolve('alreadyAdded');
                    }
                }
                pricelist.push(item);
                fs.writeFile('./config/pricelist.json', JSON.stringify(pricelist, null, 4), function(err) {
                    if (err) {
                        return reject(err);
                    }
                    return resolve(true);
                });
            });
        }
        if (action == 'remove') {
            if (!Array.isArray(item)) {
                item = [item];
            }
            let items = item;
            let itemsremoved = 0;
            fs.readFile('./config/pricelist.json', function(err, data) {
                if (err) {
                    return reject(err);
                }
                let pricelist = JSON.parse(data);
                for (i = 0; i < pricelist.length; i++) {
                    for (j = 0; j < items.length; j++) {
                        if (pricelist[i].sku == items[j]) {
                            pricelist.splice(pricelist.indexOf(pricelist[i]), 1);
                            itemsremoved++
                        }
                    }
                }
                fs.writeFile('./config/pricelist.json', JSON.stringify(pricelist, null, 4), function(err) {
                    if (err) {
                        return reject(err);
                    }
                    return resolve(itemsremoved);
                });
            });
        }
    });
}

exports.renderPricelist = function(res, type, msg) {
    fs.readFile('./config/pricelist.json', function (err, data) {
        if (err) throw err;
        res.render('home', {
            type: type,
            msg: msg,
            pricelist: JSON.parse(data)
        });
    });
}