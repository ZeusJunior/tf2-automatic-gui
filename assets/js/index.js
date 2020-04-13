const itemTemplate = {
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

const app = new Vue({
	el: '#app',
	data: {
		searchPricelist: '',
		removeSelect: {
			enabled: false,
			all: false,
			list: []
		},
		modal: {
			item: itemTemplate,
			edit: false
		},
		bulk: {
			input: '',
			intent: 2,
			min: 0,
			max: 1
		},
		pricelist: [],
		msg: {
			text: '',
			type: '',
			enabled: false
		}
	},
	methods: {
		addSingle: function() {
			this.modal.item = itemTemplate;
			this.modal.edit = false;
		},
		bulkClear: function() {
			this.bulk = {
				input: '',
				intent: 2,
				min: 0,
				max: 1
			};
		},
		itemClick: function(item, e) {
			if (this.removeSelect.enabled) {
				const index = this.removeSelect.list.indexOf(item.sku);
				if (index == -1) {
					this.removeSelect.list.push(item.sku);
				} else {
					this.removeSelect.list.splice(index, 1);
				}
			} else {
				this.modal.item= {
					name: item.name,
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
		saveItem: function(item, edit) {
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
			$('#priceModal').modal('hide');
			const url = edit ? '/changeItem' : '/addItem';
			$.ajax({
				type: 'POST',
				url: url,
				data: postData,
				success: function(data, status) {
					app.sendMessage(data.msg.type, data.msg.message);
					app.loadItems();
				},
				dataType: 'json',
				traditional: true
			});
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
				max: bulk.max
			};
			app.sendMessage('secondary', 'Bulk add started, it might take a while.');
			$('#bulkModal').modal('hide');
			$.ajax({
				type: 'POST',
				url: '/addItems',
				data: postData,
				success: function(data, status) {
					app.sendMessage(data.msg.type, data.msg.message);
					app.loadItems();
				},
				dataType: 'json',
				traditional: true
			});
		},
		removeItems: function() {
			$('#areYouSure').modal('hide');
			this.removeSelect.enabled = false;
			if (this.removeSelect.all) {
				$.ajax({
					type: 'POST',
					url: '/clearPricelist',
					success: function(data, status) {
						this.removeSelect.list = [];
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
						list: this.removeSelect.list
					},
					success: function(data, status) {
						app.removeSelect.list = [];
						app.sendMessage(data.msg.type, data.msg.message);
						app.loadItems();
					},
					dataType: 'json',
					traditional: true
				});
			}
		},
		removeSelectToggle: function() {
			this.removeSelect.enabled = !this.removeSelect.enabled;
			this.removeSelect.list = [];
		}

	},
	computed: {
		pricelistFiltered() {
			return this.pricelist.filter((item) => {
				return item.name.toLowerCase().indexOf(this.searchPricelist.toLowerCase()) > -1;
			});
		}
	},
	created() {
		this.loadItems();
	}
});
