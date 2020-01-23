const Schema = require('./schema.js');
const data = require('./data.js');
const SKU = require('tf2-sku');
const request = require('request');
const fs = require('fs');
const config = require('./config/config.json');

// Add the list of items
exports.addItems = async function(res, search, options) {
    let itemsAdded = 0;
    let items = [];
    let itemsFailed = 0;
    let failedItems = [];
    let skus = [];

    // Remove parts / paint text for bptf markdown input and remove empty entries (blank enters)
    for(i = 0; i < search.length; i++) {
        if(search[i].indexOf("Part") > -1) {
            search[i] = search[i].split(" with ").shift();
        }
        if(search[i].indexOf(" painted ") > -1) {
            search[i] = search[i].split(" painted ").shift();
        }
        if(search[i] === "") {
            search.splice(i, 1);
            i--;
        }
    }

    getAllPriced().then(async (allPrices) => { // Why, you ask? For the glory of satan of course!
        if (!allPrices) {
            exports.renderPricelist(res, 'danger', 'Error occured trying to get all prices. See the console for more information');
            return;
        }

        console.log('Got all prices, continuing...');

        // First check for item names like normal, for items like "Cool Breeze", "Hot Dogger", "Vintage Tyrolean" and whatever
        // Get those skus, and remove them from the search list so it doesn't try again
        for (i = 0, list = allPrices.length; i < list; i++) {
            if (search.indexOf(allPrices[i].name) > -1) {
                skus.push(allPrices[i].sku);
                search.splice(search.indexOf(allPrices[i].name), 1);
            }
        }

        // You can .filter before .map but not .map before .filter, SAD
        const promises = search.map(async searchItem => {
            const sku = await getSKU(searchItem);
            return sku
        });

        const generatedSkus = await Promise.all(promises);
        // Add the item skus that weren't already handled to the skus array
        skus = skus.concat(generatedSkus); 

        var start = new Date();
        // Remove items where it failed to generate a sku
        for (i = 0; i < skus.length; i++) {
            if (skus[i] === false) {
                skus.splice(skus.indexOf(skus[i]), 1);
                itemsFailed++
                i--
            }
        }
        
        for (i = 0, list = allPrices.length; i < list; i++) { // Dont recalculate length every time, it wont change
            if (skus.indexOf(allPrices[i].sku) > -1) {
                const item = {
                    sku: allPrices[i].sku, 
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
                item.name = allPrices[i].name;
                item.buy = allPrices[i].buy;
                item.sell = allPrices[i].sell;
                item.time = allPrices[i].time;

                // Add item to items array, these will be used to update the pricelist and remove from skus array
                items.push(item);
                skus.splice(skus.indexOf(allPrices[i].sku), 1);
                itemsAdded++;
            }

            if (i == allPrices.length - 1) { // Done looping
                var end = new Date() - start;
                console.info('Execution time: %dms', end);
                itemsFailed += skus.length; // items that succeeded get removed from skus 
                failedItems = skus; // so all thats left in skus is failed items
                if (itemsAdded > 0) {
                    changePricelist('add', items).then((result) => {
                        if (result > 0) {
                            itemsAdded -= result;
                        }
                        exports.renderPricelist(res, 'primary', itemsAdded + (itemsAdded == 1 ? ' item' : ' items') + ' added, ' + itemsFailed + (itemsFailed == 1 ? ' item' : ' items') + ' failed' + (result > 0 ? ', ' + result + (result == 1 ? ' item was' : ' items were') + ' already in your pricelist.' : '.'), failedItems);
                        return;
                    }).catch((err) => {
                        console.log(err);
                        return;
                    });
                } else {
                    exports.renderPricelist(res, 'primary', itemsAdded + (itemsAdded == 1 ? ' item' : ' items') + ' added, ' + itemsFailed + (itemsFailed == 1 ? ' item' : ' items') + ' failed.', failedItems);   
                }

            }
        }
    }).catch((err) => {
        console.log(err);
        exports.renderPricelist(res, 'danger', 'Error occured trying to get all prices. See the console for more information');
        return;
    })
}

exports.changeSingleItem = function (res, item) {
    fs.readFile('./config/pricelist.json', function(err, data) {
        if (err) {
            console.log(err);
            exports.renderPricelist(res, 'danger', 'Error occured trying to change the item. See the console for more information');
            return;
        }
        
        let pricelist = JSON.parse(data);
        for (i = 0; i < pricelist.length; i++) {
            if (item.sku === pricelist[i].sku) {
                pricelist[i].buy = item.buy;
                pricelist[i].sell = item.sell;
                pricelist[i].intent = item.intent;
                pricelist[i].min = item.min;
                pricelist[i].max = item.max;
                break;
            }
        }

        fs.writeFile('./config/pricelist.json', JSON.stringify(pricelist, null, 4), function(err, data) {
            if (err) {
                console.log(err);
                exports.renderPricelist(res, 'danger', 'Error occured trying to change the item. See the console for more information');
                return;
            }

            exports.renderPricelist(res, 'success', item.sku + ' has been changed');
        });
    });
}

// Remove one or multiple items
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
        return SKU.fromObject(Schema.fixItem(SKU.fromString(search)))
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

    return new Promise(async (resolve, reject) => {
        if (search.includes('backpack.tf/stats')) { // input is a stats page URL
            searchParts = search.substring(search.indexOf("stats")).split('/');

            let name = decodeURI(searchParts[2]);
            let quality = decodeURI(searchParts[1]); // Decode this too, has %20 if decorated / collector's or dual quality
            if (quality == "Strange Unusual") {
                item.quality = 5;
                item.quality2 = 11;
            } else if (quality == "Strange Haunted") {
                item.quality = 13;
                item.quality2 = 11;
            } else {
                item.quality = data.quality[searchParts[1]];
            }

            for (i = 0; i < data.killstreaks.length; i++) {
                if (name.includes(data.killstreaks[i])) {
                    name = name.replace(data.killstreaks[i] + ' ', "");
                    item.killstreak = data.killstreak[data.killstreaks[i]];
                    break;
                }
            }

            if (name.includes('Australium') && searchParts[1] === 'Strange') {
                name = name.replace('Australium ', "");
                item.australium = true;
            }

            if (item.quality == 5) {
                item.effect = parseInt(searchParts[5]);
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

            // I would use a shorthand for this but idk if that actually works with await
            let defindex;
            if (name.includes("War Paint")) {
                defindex = 16102; // Ok i know they have different defindexes but they get automatically corrected. Bless Nick.
            } else {
                defindex = await getDefindex(name);
            }

            if (defindex === false) {
                console.log("Item is not priced and couldn't get defindex: " + search)
                return resolve(false);
            }

            item.defindex = defindex;
            item.craftable = searchParts[4] === 'Craftable' ? true : false;
            return resolve(SKU.fromObject(Schema.fixItem(item)));
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

                // override decorated quality if it is unusual. Elevated is already set when setting effect. Default just decorated
                item.quality = item.effect ? 5 : 15;
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

        // I would use a shorthand for this but idk if that actually works with await
        let defindex;
        if (name.includes("War Paint")) {
            defindex = 16102; // Ok i know they have different defindexes but they get automatically corrected. Bless Nick.
        } else {
            defindex = await getDefindex(name);
        }

        if (defindex === false) {
            console.log("Item is not priced and couldn't get defindex: " + search)
            return resolve(false);
        }

        item.defindex = defindex;
        return resolve(SKU.fromObject(Schema.fixItem(item)));
    });
}

async function getDefindex(search) {
    let schema = await Schema.getTheFuckinSchemaVariableIHateMyLife();
    return new Promise((resolve, reject) => { // This is so god damn shit omg
        const items = schema.raw.schema.items;
        for (let i = 0; i < items.length; i++) {
            let name = items[i].item_name;
            if (name === search || name === search.replace('The ', "")) {
                return resolve(items[i].defindex);
            }
        }

        return resolve(false);
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
                // for each item, check if they're already in the pricelist *while changing it too* to avoid having 2 of the same
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
                    
                    // Not already added, so add
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

        // Dont think this one needs much explaining
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

// Render the pricelist with some info
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

// Summon satan
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

// Get all currently priced items on pricestf
function getAllPriced () {
    console.log('Getting all prices...');
    var start = new Date();
    return new Promise((resolve, reject) => {
        let options = {
            method: "GET",
            json: true,
            uri: "https://api.prices.tf/items",
            qs: {
                src: 'bptf'
            }
        }
        if (config.pricesApiToken) {
            options.headers = {
                'Authorization': 'Token ' + config.pricesApiToken
            }
        }
        request(options, function(err, response, body) {
            if (err) {
                return reject(err);
            }
            if (body.success == false) {
                if (body.message == 'Unauthorized') {
                    throw new Error("Your prices.tf api token is incorrect. Join the discord here https://discord.tf2automatic.com/ and request one from Nick. Or leave it blank in the config.");
                }
                return resolve(false);
            }
            var end = new Date() - start;
            console.info('Execution time: %dms', end);

            return resolve(body.items);
        });
    });
}