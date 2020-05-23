<template>
  <div class="container-xl pt-4 pb-4 bg-light border border-top-0 rounded-bottom" id="app">
		<msg ref="msg"></msg>
		<!-- REMOVE ALL MODAL -->
		<div id="areYouSure" class="modal fade" tabindex="-1" role="dialog" aria-labelledby="removeModalLabel" aria-hidden="true">
			<div class="modal-dialog modal-dialog-centered" role="document">
				<div class="modal-content">
					<div class="modal-header">
						<h5 class="modal-title" id="removeModalLabel">Are you sure?</h5>
						<button class="close" data-dismiss="modal" aria-label="Close">
							<span aria-hidden="true">&times;</span>
						</button>
					</div>
					<div class="modal-body">
						Do you want to remove items from pricelist?
					</div>
					<div class="modal-footer">
						<button type="button" class="btn btn-primary" data-dismiss="modal">No</button>
						<button type="button" class="btn btn-danger" @click="removeItems">Yes</button>
					</div>
				</div>
			</div>
		</div>

		<!-- PRICE MODAL -->
		<div id="priceModal" class="modal fade" tabindex="-1" role="dialog" aria-labelledby="priceModalLabel" aria-hidden="true">
			<div class="modal-dialog modal-dialog-centered" role="document">
				<div class="modal-content">
					<div class="modal-header">
						<h5 class="modal-title" id="priceModalLabel">{{modal.edit ? `Edit item ` : 'Add item'}}<a v-if="modal.edit" :href="modal.item.statslink" target="_blank">{{modal.item.sku}}</a></h5>
						<button class="close" data-dismiss="modal" aria-label="Close">
							<span aria-hidden="true">&times;</span>
						</button>
					</div>
					<form>
						<div class="modal-body">
						  <div class="form-row">
							<div class="col">
								<label >Name</label>
								<input class="form-control" id="pricename" name="name"  type="search" placeholder="Item name" aria-label="Search" autocomplete="off" required v-model="modal.item.name" :disabled="modal.edit" @focus="modal.searchFocus=true" @focusout="modal.searchFocus=false" @input="modal.searchDisable=false">
								

								
								<ul class="dropdown-menu search-dropdown" style="display: block; left: auto; width: 98%;" v-if="modal.searchFocus && !modal.searchDisable">
									<li class="header dropdown-item-text"  v-if="modal.item.name==''">What item are you looking for?</li>
									<li class="mini-price dropdown-item" v-for="item in itemSearch" :key="item.defindex" @mousedown="searchClick(item)"><!-- this must have mousedown event because it is fired before focusout-->
										<div class="item-mini" :style="{ backgroundImage: `url(` + item.image_small + `)`, backgroundColor: item.quality_color, borderStyle: item.craftable? false : 'dashed', borderColor: item.border_color}"><img :src="item.image_small"></div>
										<div class="item_name"> {{item.name}}</div>
									</li>
								</ul>
							</div>
						  </div>
						  <div class="form-row">
							<div class="col" id="enableddiv">
							  	<div class="pretty p-switch p-fill">
									<input type="checkbox" name="enabled" id="enabled" v-model="modal.item.enabled" :disabled="!modal.edit"/>
									<div class="state p-success">
										<label>Enabled</label>
									</div>
								</div>
							</div>
						  </div>
						  <div class="form-row" v-if="modal.item.enabled">
							<div class="col" id="autopricediv">
							  	<div class="pretty p-switch p-fill">
									<input type="checkbox" name="autoprice" id="autoprice" v-model="modal.item.autoprice" @change="setPriceToAuto(autopriceCalc)"/>
									<div class="state p-success">
										<label>Autoprice</label>
									</div>
								</div>
							</div>
						  </div>
						  <div class="form-row" v-if="modal.item.enabled&&(modal.item.intent!=1)">
							<div class="col">
							  <label>Buy keys {{(autopriceCalc.buy.keys===null||modal.item.autoprice)?'':' A: ' + autopriceCalc.buy.keys}}</label>
							  <input type="number" class="form-control" id="buykeys" name="buykeys" min="0" placeholder="Keys" required :disabled="modal.item.autoprice" v-model="modal.item.buy.keys">
							</div>
							<div class="col">
							  <label >Buy metal {{(autopriceCalc.buy.metal===null||modal.item.autoprice)?'':' A: ' + autopriceCalc.buy.metal}}</label>
							  <input type="number" class="form-control" id="buymetal" name="buymetal" min="0" placeholder="Metal" step="any" required :disabled="modal.item.autoprice" v-model="modal.item.buy.metal">
							</div>
						  </div>
						  <div class="form-row" v-if="modal.item.enabled&&(modal.item.intent!=0)">
							<div class="col">
							  <label>Sell keys {{(autopriceCalc.sell.keys===null||modal.item.autoprice)?'':' A: ' + autopriceCalc.sell.keys}}</label>
							  <input type="number" class="form-control" id="sellkeys" name="sellkeys" min="0" placeholder="Keys" required :disabled="modal.item.autoprice" v-model="modal.item.sell.keys">
							</div>
							<div class="col">
							  <label>Sell metal {{(autopriceCalc.sell.metal===null||modal.item.autoprice)?'':' A: ' + autopriceCalc.sell.metal}}</label>
							  <input type="number" class="form-control" id="sellmetal" name="sellmetal" min="0" placeholder="Metal" step="any" required :disabled="modal.item.autoprice" v-model="modal.item.sell.metal">
							</div>
						  </div>
						  <div class="form-row" v-if="modal.item.enabled">
							<div class="col" id="priceintentdiv">
							  <label>Intent</label>
							  <select name="intent" class="form-control" id="priceintent"  v-model="modal.item.intent">
								<option value="2">Bank (buy and sell)</option>
								<option value="0">Buy</option>
								<option value="1">Sell</option>
							  </select>
							</div>
							<div class="col">
							  <label>Minimum stock</label>
							  <input type="number" class="form-control" id="priceminimum" name="min" min="0" required v-model="modal.item.min">
							</div>
							<div class="col">
							  <label>Maximum stock</label>
							  <input type="number" class="form-control" id="pricemaximum" name="max" min="0" required v-model="modal.item.max">
							</div>
						  </div>
						</div>
						<div class="modal-footer">
							<button type="button" v-if="!modal.edit" class="btn btn-primary" @click="resetModal()">Clear</button>
							<button type="button" class="btn btn-secondary" data-dismiss="modal">Cancel</button>
							<button type="submit" class="btn btn-primary" @click.prevent="saveItem(modal.item, modal.edit, true)">Save</button>
							<button type="button" v-if="modal.edit" class="btn btn-danger" @click="deleteItem(modal.item)">Delete item</button>
						</div>
					</form>
				</div>
			</div>
		</div>

		<div id="bulkModal" class="modal fade" tabindex="-1" role="dialog" aria-labelledby="bulkModalLabel" aria-hidden="true">
			<div class="modal-dialog modal-dialog-centered" role="document">
				<div class="modal-content">
					<div class="modal-header">
						<h5 class="modal-title" id="bulkModalLabel">Add items in bulk</h5>
						<button class="close" data-dismiss="modal" aria-label="Close">
							<span aria-hidden="true">&times;</span>
						</button>
					</div>
					<form>
						<div class="modal-body">
							<div class="form-group">
								<label for="url">Items</label>
								<textarea rows="5" class="form-control" id="url" name="input" placeholder="Add the backpack.tf stats page, sku, or the items name. Seperate multiple inputs by a new line. See console for speed" required v-model="bulk.input"></textarea>
							</div>
							<div class="form-row">
								<div class="col">
									  <div class="pretty p-switch p-fill">
										<input type="checkbox" name="autoprice" v-model="bulk.autoprice"/>
										<div class="state p-success">
											<label>Autoprice</label>
										</div>
									</div>
								</div>
							</div>
							<div class="form-row" v-if="!bulk.autoprice&&(bulk.intent!=1)">
								<div class="col">
									<label>Buy keys</label>
									<input type="number" class="form-control" name="buykeys" min="0" placeholder="Keys" v-model="bulk.buy.keys">
								</div>
								<div class="col">
									<label >Buy metal</label>
									<input type="number" class="form-control" name="buymetal" min="0" placeholder="Metal" step="any" v-model="bulk.buy.metal">
								</div>
							</div>
							<div class="form-row" v-if="!bulk.autoprice&&(bulk.intent!=0)">
								<div class="col">
									<label>Sell keys</label>
									<input type="number" class="form-control" name="sellkeys" min="0" placeholder="Keys" v-model="bulk.sell.keys">
								</div>
								<div class="col">
									<label>Sell metal</label>
									<input type="number" class="form-control" name="sellmetal" min="0" placeholder="Metal" step="any" v-model="bulk.sell.metal">
								</div>
							</div>
							<div class="form-row">
								<div class="col">
								  	<label for="intent">Intent</label>
								  	<select name="intent" class="form-control" id="intent" v-model="bulk.intent">
										<option selected="selected" value="2">Bank (buy and sell)</option>
										<option value="0">Buy</option>
										<option value="1">Sell</option>
								  	</select>
								</div>
								<div class="col">
								  	<label for="minimum">Minimum stock</label>
								  	<input type="number" class="form-control" id="minimum" name="min" min="0" value="0" required v-model="bulk.min">
								</div>
								<div class="col">
								  	<label for="maximum">Maximum stock</label>
								  	<input type="number" class="form-control" id="maximum" name="max" min="0" value="1" required v-model="bulk.max">
								</div>
							  </div>
						</div>
						<div class="modal-footer">
							<button type="submit" class="btn btn-primary" @click.prevent="bulkAdd(bulk)">Add</button>
							<button type="button" class="btn btn-secondary" data-dismiss="modal">Cancel</button>
						</div>
					</form>
				</div>
			</div>
		</div>

		<ul class="nav nav-pills justify-content-between">
			<li class="nav-item">
				<div class="btn-group" v-if="!multiSelect.enabled">
					<button type="button" class="btn btn-success border-left" data-toggle="modal" data-target="#priceModal" @click="addSingle">Add Item</button>
					<button type="button" class="btn btn-primary border-right border-left" data-toggle="modal" data-target="#bulkModal" @click="bulkClear">Bulk add</button>
					<button type="button" class="btn btn-primary border-right border-left" @click="multiSelectToggle">Select multiple items</button>
					<button type="button" class="btn btn-danger border-right" data-toggle="modal" data-target="#areYouSure" @click="multiSelect.all=true">Delete all items</button>
				</div>
			</li>
			<li class="nav-item">
				<label for="sortType">Sort by:</label>
				<select name="sortType" id="sortType" v-model="sort.type">
					<option value=0>Name</option>
					<option value=1>Sell price</option>
					<option value=2>Buy price</option>
				</select>
				<button type="button" class="btn btn-primary p-1" @click="sort.asc = !sort.asc"> <img :src="'/images/' + (sort.asc?'ascending':'descending') + '.svg'" :alt="sort.asc?'ascending':'descending'" height="24px"></button>
			</li>
			<li class="nav-item">
				<div class="btn-group">
					<button type="button" class="btn border-right" :class="{'active': list}" @click="list=true"><img src="/images/list.svg" alt="list"></button>
					<button type="button" class="btn" :class="{'active': !list}" @click="list=false"><img src="/images/grid.svg" alt="grid"></button>
				</div>
			</li>
			<li class="nav-item">
				<input class="form-control mr-sm-2" id="searchPricelist" type="search" placeholder="Search" aria-label="Search" autocomplete="off" v-model="searchPricelist">
			</li>
		</ul>
		<div v-if="multiSelect.enabled">
			<div class="btn-group" >
				<button type="button" class="btn border-left" :class="['btn-' + ((multiSelect.list.length==0)?'dark':'danger')]" data-toggle="modal" data-target="#areYouSure" :disabled="multiSelect.list.length==0" @click="multiSelect.all=false">Delete selected items</button>
				<button type="button" class="btn border-right border-left" :class="['btn-' + ((multiSelect.list.length==0)?'dark':'primary')]" :disabled="multiSelect.list.length==0" @click="multiSelect.all=false;changeEnableState(false)">Disable selected items</button>
				<button type="button" class="btn border-right border-left" :class="['btn-' + ((multiSelect.list.length==0)?'dark':'primary')]" :disabled="multiSelect.list.length==0" @click="multiSelect.all=false;changeEnableState(true)">Enable selected items</button>
				<button type="button" class="btn border-right btn-success" @click="multiSelectToggle">Cancel</button>
			</div>
			<span>
				{{multiSelect.list.length}} {{multiSelect.list.length==1? 'item': 'items'}} selected.
			</span>
		</div>
		
		<div v-if="!list" class="d-flex mt-3 flex justify-content-center flex-wrap" id="pricelist">
			<item-grid v-for="item in pricelistSorted" :key="item.sku" :item="item" :selected="multiSelect.list.includes(item.sku)" @item-click="itemClick"></item-grid>
		</div>
		<div v-else class="d-flex mt-3 flex justify-content-center flex-wrap" id="pricelist">
			<list-view :pricelist="pricelistSorted" :select="multiSelect" @item-click="itemClick"></list-view>
		</div>
	</div>
</template>

<script>

import $ from 'jquery';
import axios from 'axios';

// components
import ItemGrid from './components/item-grid.vue';
import msg from './components/msg.vue';
import ListView from './components/list-view.vue';

// scroll button
import './js/scrollButton';

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

export default {
	components: {
		ItemGrid,
		ListView,
		msg
	},
	data: function() { 
		return {
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
		}
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
		itemClick: function(item) {
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
				this.$refs.msg.sendMessage('danger', 'Item name is missing');
				if (fromModal) {
					$('#priceModal').modal('hide');
				}
				return;
			}
			const postData = {
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
			
			this.$refs.msg.sendMessage(res.data.msg.type, res.data.msg.message);
			if (fromModal ) {
				if (res.data.msg == 'success') this.resetModal();
				this.loadItems();
			}
		},
		deleteItem: function(item) {
			const postData = { list: [item.sku] };
			$('#priceModal').modal('hide');
			$.ajax({ //todo axios
				type: 'POST',
				url: '/removeItems',
				data: postData,
				success: (data, status) => {
					if (data.removed > 0) {
						this.$refs.msg.sendMessage('success', 'successfully removed ' + data.removed + (data.removed === 1 ? ' item':' items'));
					}
					this.loadItems();
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
			const postData = {
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
			this.$refs.msg.sendMessage('secondary', 'Bulk add started, it might take a while.');
			$('#bulkModal').modal('hide');
			axios({
				method: 'POST',
				url: '/addItems',
				data: postData
			})
				.then((resp)=>{
					this.$refs.msg.sendMessage(resp.data.msg.type, resp.data.msg.message);
					this.loadItems();
				});
		},
		removeItems: function() {
			$('#areYouSure').modal('hide');
			this.multiSelect.enabled = false;
			if (this.multiSelect.all) {
				$.ajax({ // todo axios
					type: 'POST',
					url: '/clearPricelist',
					success: (data, status) => {
						this.multiSelect.list = [];
						this.$refs.msg.sendMessage(data.msg.type, data.msg.message);
						this.loadItems();
					},
					dataType: 'json',
					traditional: true
				});
			} else {
				$.ajax({ // todo axios
					type: 'POST',
					url: '/removeItems',
					data: {
						list: this.multiSelect.list
					},
					success: (data, status) => {
						this.multiSelect.list = [];
						this.$refs.msg.sendMessage(data.msg.type, data.msg.message);
						this.loadItems();
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
			this.loadItems();
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
}
</script>