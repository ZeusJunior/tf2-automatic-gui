const itemTemplate = {
	name: '',
	statslink: '',
	autoprice: true,
	sku: '',
	enabled: true,
	buy: {
		keys: 0,
		metal: 0
	},
	sell: {
		keys: 0,
		metal: 0
	},
	intent: 2,
	min: 0,
	max: 1
};

const app = new Vue({
	el: '#app',
	data: {
		searchPricelist: '',
		multiSelect: {
			enabled: false,
			all: false,
			list: []
		},
		modal: {
			item: itemTemplate,
			edit: false,
			searchResults: [],
			searchFocus: false,
			searchDisable: false
		},
		bulk: {
			input: '',
			intent: 2,
			min: 0,
			max: 1,
			autoprice: true,
			buy: {
				keys: 0,
				metal: 0
			},
			sell: {
				keys: 0,
				metal: 0
			}
		},
		pricelist: [],
		msg: {
			text: '',
			type: '',
			enabled: false
		},
		sort: {
			type: 0,
			asc: true
		},
		list: false
	},
	methods: {
		addSingle: function() {
			if (this.modal.edit) this.resetModal();
		},
		bulkClear: function() {
			this.bulk = {
				input: '',
				intent: 2,
				min: 0,
				max: 1,
				autoprice: true,
				buy: {
					keys: 0,
					metal: 0
				},
				sell: {
					keys: 0,
					metal: 0
				}
			};
		},
		itemClick: function(item, e) {
			if (this.multiSelect.enabled) {
				const index = this.multiSelect.list.indexOf(item.sku);
				if (index == -1) {
					this.multiSelect.list.push(item.sku);
				} else {
					this.multiSelect.list.splice(index, 1);
				}
			} else {
				this.modal.item= {
					name: item.name,
					statslink: item.statslink,
					autoprice: item.autoprice,
					sku: item.sku,
					enabled: item.enabled,
					buy: {
						keys: item.buy.keys,
						metal: item.buy.metal
					},
					sell: {
						keys: item.sell.keys,
						metal: item.sell.metal
					},
					intent: item.intent,
					min: item.min,
					max: item.max
				},
				this.modal.edit = true;
				$('#priceModal').modal('show');
			}
		},
		loadItems: function() {
			fetch('/getItems')
				.then((response) => {
					return response.json();
				})
				.then((data) => {
					this.pricelist = data.pricelist;
				})
				.catch((error) => {
					console.error('Error:', error);
				});
		},
		saveItem: async function(item, edit, fromModal) {
			if (item.name === '') {
				app.sendMessage('danger', 'Item name is missing');
				if (fromModal) {
					$('#priceModal').modal('hide');
				}
				return;
			}
			postData = {
				name: item.name,
				sku: item.sku,
				intent: item.intent,
				autoprice: item.autoprice,
				min: item.min,
				max: item.max,
				sellkeys: item.sell.keys,
				sellmetal: item.sell.metal,
				buykeys: item.buy.keys,
				buymetal: item.buy.metal,
				enabled: item.enabled
			};
			if (fromModal) {
				$('#priceModal').modal('hide');
			}
			const url = edit ? '/changeItem' : '/addItem';
			const res = await axios({
				method: 'post',
				url: url,
				data: postData
			});
			
			app.sendMessage(res.data.msg.type, res.data.msg.message);
			if (fromModal ) {
				if (res.data.msg == 'success') this.resetModal();
				app.loadItems();
			}
		},
		deleteItem: function(item) {
			postData = { list: [item.sku] };
			$('#priceModal').modal('hide');
			$.ajax({
				type: 'POST',
				url: '/removeItems',
				data: postData,
				success: function(data, status) {
					if (data.removed > 0) {
						app.sendMessage('success', 'successfully removed ' + data.removed + (data.removed === 1 ? ' item':' items'));
					}
					app.loadItems();
				},
				dataType: 'json',
				traditional: true
			});
		},
		sendMessage: function(type, text) {
			this.msg.enabled = true;
			this.msg.text = text;
			this.msg.type = type;
		},
		closeMessage: function() {
			this.msg.enabled = false;
		},
		bulkAdd: function(bulk) {
			postData = {
				input: bulk.input,
				intent: bulk.intent,
				min: bulk.min,
				max: bulk.max,
				autoprice: bulk.autoprice,
				buy_keys: bulk.buy.keys,
				buy_metal: bulk.buy.metal,
				sell_keys: bulk.sell.keys,
				sell_metal: bulk.sell.metal
			};
			app.sendMessage('secondary', 'Bulk add started, it might take a while.');
			$('#bulkModal').modal('hide');
			axios({
				method: 'POST',
				url: '/addItems',
				data: postData
			})
				.then((resp) => {
					app.sendMessage(resp.data.msg.type, resp.data.msg.message);
					app.loadItems();
				});
		},
		removeItems: function() {
			$('#areYouSure').modal('hide');
			this.multiSelect.enabled = false;
			if (this.multiSelect.all) {
				$.ajax({
					type: 'POST',
					url: '/clearPricelist',
					success: function(data, status) {
						this.multiSelect.list = [];
						app.sendMessage(data.msg.type, data.msg.message);
						app.loadItems();
					},
					dataType: 'json',
					traditional: true
				});
			} else {
				$.ajax({
					type: 'POST',
					url: '/removeItems',
					data: {
						list: this.multiSelect.list
					},
					success: function(data, status) {
						app.multiSelect.list = [];
						app.sendMessage(data.msg.type, data.msg.message);
						app.loadItems();
					},
					dataType: 'json',
					traditional: true
				});
			}
		},
		multiSelectToggle: function() {
			this.multiSelect.enabled = !this.multiSelect.enabled;
			this.multiSelect.list = [];
		},
		changeEnableState: async function(newState) {
			this.multiSelect.enabled = false;
			for (let i = 0; i < this.multiSelect.list.length; i++) {
				const item = this.pricelist.filter((item) => {
					return item.sku.indexOf(this.multiSelect.list[i]) > -1;
				})[0];
				item.enabled = newState;
				await this.saveItem(item, true, true); // await so we are not sending miltiple requests at the same time, othewise polldata will get corrupted
			}
			this.multiSelect.list = [];
			app.loadItems();
		},
		searchClick: function(item) {
			this.modal.item.name = item.name;
			this.modal.item.sku = item.sku;
			this.modal.searchDisable = true;
		},
		setPriceToAuto: function(autopricePrices) {
			// do this to copy only value
			this.modal.item.buy.metal = autopricePrices.buy.metal;
			this.modal.item.buy.keys = autopricePrices.buy.keys;
			this.modal.item.sell.metal = autopricePrices.sell.metal;
			this.modal.item.sell.keys = autopricePrices.sell.keys;
		},
		resetModal() {
			this.modal.item = {
				name: '',
				autoprice: true,
				sku: '',
				enabled: true,
				buy: {
					keys: 0,
					metal: 0
				},
				sell: {
					keys: 0,
					metal: 0
				},
				intent: 2,
				min: 0,
				max: 1
			};
			this.modal.edit = false;
			this.modal.searchResults = [];
			this.modal.searchFocus = false;
			this.modal.searchDisable = false;
		}

	},
	computed: {
		pricelistFiltered() {
			return this.pricelist.filter((item) => {
				return item.name.toLowerCase().indexOf(this.searchPricelist.toLowerCase()) > -1 || item.sku.toLowerCase().indexOf(this.searchPricelist.toLowerCase()) > -1; // search by name or sku
			});
		},
		pricelistSorted() {
			return this.pricelistFiltered.sort((a, b) => {
				if (!this.sort.asc) {
					b = [a, a = b][0];
				}
				switch (Number(this.sort.type)) {
				default:
				case 0: // name
					return ('' + a.name).localeCompare(b.name);
				case 1: // sell price
					return a.sell.total - b.sell.total;
					break;
				case 2: // buy price
					return a.buy.total - b.buy.total;
					break;
				case 3: // buy price
					return a.intent - b.intent;
					break;
				}
			});
		}
	},
	asyncComputed: {
		async itemSearch() {
			if (this.modal.item.name=='') return [];
			const res = await axios({
				method: 'get',
				url: '/search',
				params: {
					text: this.modal.item.name
				}
			});
			return res.data.results;
		},
		autopriceCalc: {
			async get() {
				const prices = {
					buy: {
						keys: null,
						metal: null
					},
					sell: {
						keys: null,
						metal: null
					}
				};
				
				if (this.modal.item.sku == '') {
					return prices;
				}
				try {
					const res = await axios({
						method: 'get',
						url: '/autoprice',
						params: {
							sku: this.modal.item.sku
						},
						type: 'json'
					});
					if (res.data.success) {
						prices.buy = res.data.buy;
						prices.sell = res.data.sell;
					}
				} catch (err) {
					console.log(err);
				}
				if (this.modal.item.autoprice) {
					this.setPriceToAuto(prices);
				}
				return prices;
			},
			default: {
				buy: {
					keys: null,
					metal: null
				},
				sell: {
					keys: null,
					metal: null
				}
			}
		}
	},
	created() {
		this.loadItems();
	}
});
