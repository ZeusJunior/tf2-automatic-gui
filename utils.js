const Schema = require('./schema.json');
const data = require('./data.js');
const SKU = require('tf2-sku');
const request = require('request');
const Bottleneck = require('bottleneck');
const limiter = new Bottleneck({
    reservoir: 1000,
    reservoirRefreshAmount: 1000,
    reservoirRefreshInterval: 5 * 60 * 1000, // 5 minutes
    maxConcurrent: 1,
    minTime: 75
});
const fs = require('fs');
const config = require('./config/config.json');

if (!config.pricesApiToken || config.pricesApiToken == "getThisFromNickInTheDiscordServer") {
    throw new Error("You're missing the prices.tf api token. Join the discord here https://discord.tf2automatic.com/ and request one from Nick");
}

let itemsAdded = 0;
let itemsFailed = 0;
let items = [];
let failedItems = [];
let scopedRes;
exports.addItem = async function(res, search, options) {
    scopedRes = res;
    for(i = 0; i < search.length; i++) {
        if(search[i] === "") {
            search.splice(i, 1);
            i--;
        }
    }
    const promises = search.map(async searchItem => {
        const sku = await getSKU(searchItem);
        return sku
    });

    const skus = await Promise.all(promises);
    for (i = 0; i < skus.length; i++) {
        let sku = skus[i]
        if (sku == false) {
            itemsFailed++
            continue;
        }

        const item = {
            sku: sku, 
            enabled: true, 
            autoprice: true, 
            max: options.max, 
            min: options.min, 
            intent: options.intent, 
            name: "",
            buy: {},
            sell: {},
            time: 0
        }

        limiter.schedule(() => getInfo(sku))
            .then((info) => {
                console.log('Currently handling:', sku);
                if (!info.success) {
                    itemsFailed++;
                    failedItems.push(info.item);
                    return;
                }
                item.sku = info.item.sku;
                item.name = info.item.name;
                item.buy = info.item.buy;
                item.sell = info.item.sell;
                item.time = info.item.time;

                items.push(item);
                itemsAdded++;
                return;
            })
            .catch((err) => {
                console.log(err);
                return;
            })
    }
}

exports.removeItems = function(items) {
    return new Promise((resolve, reject) => {
        if (items.length == 0) {
            return resolve(false)
        }
        if (!Array.isArray(items)) {
            items = [items];
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
    if (search.includes(';')) { // too lazy
        return search;
    }
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
    return new Promise((resolve, reject) => {
        if (search.includes('backpack.tf/stats')) { // input is a stats page URL
            search = search.substring(search.indexOf("stats")).split('/');

            let name = decodeURI(search[2]);
            let quality = decodeURI(search[1]); // Decode, has %20 if decorated / dual quality
            if (quality == "Strange Unusual") {
                item.quality = 5;
                item.quality2 = 11;
            } else if (quality == "Strange Haunted") {
                item.quality = 13;
                item.quality2 = 11;
            } else {
                item.quality = data.quality[search[1]];
            }

            for (i = 0; i < data.killstreaks.length; i++) {
                if (name.includes(data.killstreaks[i])) {
                    name = name.replace(data.killstreaks[i] + ' ', "");
                    item.killstreak = data.killstreak[data.killstreaks[i]];
                    break;
                }
            }

            if (name.includes('Australium') && search[1] === 'Strange') {
                name = name.replace('Australium ', "");
                item.australium = true;
            }

            if (item.quality == 5) {
                item.effect = parseInt(search[5]);
            }

            for (i = 0; i < data.wears.length; i++) {
                if (name.includes(data.wears[i])) {
                    name = name.replace(' ' + data.wears[i], "");
                    item.wear = data.wear[data.wears[i]];
                    break;
                }
            }

            if (item.wear) { // Is a skin, any quality
                for (i = 0; i < data.skins.length; i++) {
                    if (name.includes(data.skins[i])) {
                        name = name.replace(data.skins[i] + ' ', "");
                        name = name.replace('| ', '') // Remove | in the bptf link
                        item.paintkit = data.skin[data.skins[i]];
                        if (item.effect) { // override decorated quality if it is unusual
                            item.quality = 5;
                        }
                        break;
                    }
                }
            }

            let defindex;
            if (name.includes("War Paint")) {
                defindex = 16102; // Ok i know they have different defindexes but they get automatically corrected. Bless Nick.
            } else {
                defindex = getDefindex(name);
            }

            if (defindex === false) {
                resolve(false);
            }

            item.defindex = defindex;
            item.craftable = search[4] === 'Craftable' ? true : false;
            resolve(SKU.fromObject(item));
        }
        // handle item name inputs
        let name = search;
        for (i = 0; i < data.effects.length; i++) {
            if (name.includes(data.effects[i])) {
                name = name.replace(data.effects[i] + ' ', "");
                item.effect = data.effect[data.effects[i]];
                // Has an effect, check if its strange. If so, set strange elevated
                if (item.quality == 11) {
                    item.quality = 5;
                    item.quality2 = 11;
                }
                break;
            }
        }

        if (name.includes('Non-Craftable')) {
            name = name.replace('Non-Craftable ', "");
            item.craftable = false;
        }

        if (name.includes("Strange Haunted")) {
            item.quality = 13;
            item.quality2 = 11;
        } else {
            for (i = 0; i < data.qualities.length; i++) {
                if (name.includes(data.qualities[i])) {
                    name = name.replace(data.qualities[i] + ' ', "");
                    item.quality = data.quality[data.qualities[i]];
                    break;
                }
            }
        }

        for (i = 0; i < data.skins.length; i++) {
            if (name.includes(data.skins[i])) {
                name = name.replace(data.skins[i] + ' ', "");
                item.paintkit = data.skin[data.skins[i]];
                for (i = 0; i < data.wears.length; i++) {
                    if (name.includes(data.wears[i])) {
                        name = name.replace(' ' + data.wears[i], "");
                        item.wear = data.wear[data.wears[i]];
                        break;
                    }
                }

                if (item.effect) { // override decorated quality if it is unusual. Elevated is already set when setting effect
                    item.quality = 5;
                }

                item.quality = 15; // default just decorated
                break;
            }
        }

        for (i = 0; i < data.killstreaks.length; i++) {
            if (name.includes(data.killstreaks[i])) {
                name = name.replace(data.killstreaks[i] + ' ', "");
                item.killstreak = data.killstreak[data.killstreaks[i]];
                break;
            }
        }

        if (name.includes('Australium') && item.quality === 11) {
            name = name.replace('Australium ', "");
            item.australium = true;
        }

        let defindex;
        if (name.includes("War Paint")) {
            defindex = 16102; // Ok i know they have different defindexes but they get automatically corrected. Bless Nick.
        } else {
            defindex = getDefindex(name);
        }

        if (defindex === false) {
            resolve(false);
        }

        item.defindex = defindex;
        resolve(SKU.fromObject(item));
    });
}

function getDefindex(search) {
    const items = Schema.schema.items;
    for (let i = 0; i < items.length; i++) {
        let name = items[i].item_name;
        if (name === search || name === search.replace('The ', "")) {
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
            },
            headers: {
                'Authorization': 'Token ' + config.pricesApiToken
            }
        }, function(err, response, body) {
            if (err) {
                return reject(err);
            }
            if (body.success == false) {
                if (body.message == 'Unauthorized') {
                    throw new Error("Your prices.tf api token is incorrect. Join the discord here https://discord.tf2automatic.com/ and request one from Nick");
                }
                return resolve({success: false, item: sku});
            }
            if (body.buy == null || body.sell == null) {
                return resolve({success: false, item: sku});
            }
            return resolve({success: true, item: body});
        });
    });
}

function changePricelist(action, items) {
    return new Promise((resolve, reject) => {
        if (action == 'add') {
            let alreadyAdded = 0;
            fs.readFile('./config/pricelist.json', function(err, data) {
                if (err) {
                    return reject(err);
                }
                let pricelist = JSON.parse(data);
                itemsloop:
                for (j = 0; j < items.length; j++) {
                    for (i = 0; i < pricelist.length; i++) {
                        if (pricelist[i].sku == items[j].sku) {
                            alreadyAdded++
                            if (items.length - 1 == j) {
                                fs.writeFile('./config/pricelist.json', JSON.stringify(pricelist, null, 4), function(err) {
                                    if (err) {
                                        return reject(err);
                                    }
                                    return resolve(alreadyAdded);
                                });
                            }
                            continue itemsloop;
                        }
                    }
                    pricelist.push(items[j]);
                    if (items.length - 1 == j) {
                        fs.writeFile('./config/pricelist.json', JSON.stringify(pricelist, null, 4), function(err) {
                            if (err) {
                                return reject(err);
                            }
                            return resolve(alreadyAdded);
                        });
                    }
                }
            });
        }
        if (action == 'remove') {
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

exports.renderPricelist = function(res, type, msg, failedItems = []) {
    fs.readFile('./config/pricelist.json', function (err, data) {
        if (err) throw err;
        res.render('home', {
            type: type,
            msg: msg,
            pricelist: JSON.parse(data),
            failedItems: failedItems
        });
    });
}

exports.clearPricelist = function(res) {
    fs.writeFile('./config/pricelist.json', '[]', function(err) {
        if (err) {
            console.log(err)
            exports.renderPricelist(res, 'danger', 'Error occured trying to clear the pricelist. See the console for more information');
            return;
        }
        exports.renderPricelist(res, 'success', 'Pricelist has been cleared');
    });
}

limiter.on("error", function (error) {
    // idc lol
    console.log("Error with the api limiter:", error);
});

limiter.on("depleted", function (empty) {
    console.log("Hit api limits, waiting before continuing...");
});

limiter.on("empty", function () {
    console.log("Queue empty, writing to file...");
    if (itemsAdded > 0) {
        changePricelist('add', items).then((result) => {
            if (result > 0) {
                itemsAdded -= result;
            }
            exports.renderPricelist(scopedRes, 'primary', itemsAdded + (itemsAdded == 1 ? ' item' : ' items') + ' added, ' + itemsFailed + (itemsFailed == 1 ? ' item' : ' items') + ' failed' + (result > 0 ? ', ' + result + (result == 1 ? ' item was' : ' items were') + ' already in your pricelist.' : '.'), failedItems);
            itemsAdded = 0;
            itemsFailed = 0;
            items = [];
            failedItems = [];
            scopedRes = null; 
            return;
        }).catch((err) => {
            console.log(err);
            return;
        });
    } else {
        exports.renderPricelist(scopedRes, 'primary', itemsAdded + (itemsAdded == 1 ? ' item' : ' items') + ' added, ' + itemsFailed + (itemsFailed == 1 ? ' item' : ' items') + ' failed.', failedItems);
        itemsAdded = 0;
        itemsFailed = 0;
        items = [];
        failedItems = [];
        scopedRes = null;    
    }
});