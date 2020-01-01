const Schema = require('./schema.json');
const data = require('./data.js');
const SKU = require('tf2-sku');
const request = require('request');
const fs = require('fs');

exports.addItem = async function(search) {
    let sku = getSKU(search);
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
        return false;
    }
    item.sku = sku;
    getInfo(sku).then((info) => {
        item.name = info.name;
        item.buy = info.buy;
        item.sell = info.sell;
        item.time = info.time;
        changePricelist('add', item).then((result) => {
            return true;
        }).catch((err) => {
            console.log(err);
            return false;
        })
    }).catch((err) => {
        console.log(err);
        return false;
    });
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
            return 'no defindex found';
        }
        item.defindex = defindex;
        item.quality = data.qualities[search[1]];
        item.craftable = search[4] === 'Craftable' ? true : false;
        return SKU.fromObject(item);
    }
    // handle item name inputs

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

async function getInfo(sku) {
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
                reject(err);
            }
            if (body.success == false) {
                reject(false);
            }
            resolve(body);
        });
    });
}

async function changePricelist(action, item) {
    return new Promise((resolve, reject) => {
        if (action == 'add') {
            fs.readFile('./config/pricelist.json', function(err, data) {
                if (err) {
                    reject(err);
                }
                let pricelist = JSON.parse(data);
                pricelist.push(item);
                fs.writeFile('./config/pricelist.json', JSON.stringify(pricelist, null, 4), function(err) {
                    if (err) {
                        reject(err);
                    }
                    resolve(true);
                })
            });
        }
        if (action == 'remove') {
            // Something
        }
    })
}

function trunc(number, decimals = 2) {
    const factor = Math.pow(10, decimals);
    return Math.floor(number * factor) / factor;
};