<template>
  	<div class="container-fluid pt-4 pb-4 bg-light border border-top-0 rounded-bottom" id="app">
		<msg ref="msg"></msg>
		<div style="text-align: center;">
			<h1>Trades</h1>
		</div>
		<div class="row">
			<div class="col">
				<input class="form-control mr-sm-2" id="searchPricelist" type="search" placeholder="Search for trade or partner ID" aria-label="Search" autocomplete="off" v-model="search">
			</div>
			<div class="col">
				<select name="intent" class="form-control" id="order" v-model="order">
					<option value="1">newest to old</option>
					<option value="0">oldest to new</option>
				</select>
				<label for="order">Sort trades by time</label>
			</div>
			<div class="col">
				<div class="pretty p-switch p-fill">
					<input type="checkbox" name="acceptedOnly" id="acceptedOnly" v-model="acceptedOnly"/>
					<div class="state p-success">
					<label>Accepted only</label>
					</div>
				</div>
			</div>
		</div>
		<div class="mt-3" id="tradeList">
			<div class="p-2 rounded border m-2 trade" v-for="trade in tradeList" :key="trade.id" :class="trade.accepted? '': 'declined'">
				<div>
					{{trade.datetime}}: Trade <b>#{{trade.id}}</b> with <a :href="'https://steamcommunity.com/profiles/' + trade.partner"  target="_blank" class="steam-profile">{{trade.partner}}.</a>
            		{{trade.accepted? `Profit: ${trade.profit}`: ` Trade unsuccessfull, reason: ${trade.lastState}.`}}
				</div>
			<div class="float-right">{{trade.datetime}}</div>
				<div class="row">
					<div class="col item-list">
						<div>Our: {{trade.hasOwnProperty('value')? `${trade.value.our.keys} keys, ${trade.value.our.metal} metal`: ''}}</div>
						<item-grid v-for="item in trade.items.our" :key="item.sku" :item="Object.assign({}, item, items[item.sku])" :selected="false"></item-grid>
					</div>
					<div class="col item-list">
						<div>Their: {{trade.hasOwnProperty('value')? `${trade.value.their.keys} keys, ${trade.value.their.metal} metal`: ''}}</div>
						<item-grid v-for="item in trade.items.their" :key="item.sku" :item="Object.assign({}, item, items[item.sku])" :selected="false"></item-grid>
					</div>
				</div>
			</div>
			<button class="p-2" v-if="tradeList.length >= toShow" @click="toShow+=25">
				Show More
			</button>
		</div>
	</div>
</template>

<script>
// components
import ItemGrid from './components/item-grid.vue';
import msg from './components/msg.vue';

let loadLock = false; // to prevent multiple requests from being fired while waiting for one to return

export default {
components: {
		ItemGrid,
		msg
	},
	data: ()=>{
		return {
			tradeList: [],
			items: [],
			toShow: 50,
			search: '',
			order: 1,
			acceptedOnly: 0,
			tradeCount: 0
		}
	},
	methods: {
		loadTrades: function(first=0, count=50) {
			loadLock=true;
			fetch(`/trades?json=true&first=${first}&count=${count}&dir=${this.order}&search=${encodeURIComponent(this.search)}`)
				.then((response) => {
					return response.json();
				})
				.then((data) => {
					if (data.success) {
						this.tradeCount = data.data.tradeCount;
						if (first === 0) {
							this.tradeList = data.data.trades;
							this.items = data.data.items;
						} else { // we are just adding items
							this.tradeList = this.tradeList.concat(data.data.trades);
							this.items = Object.assign(this.items, data.data.items);
							this.filteredTrades = this.filteredTrades.sort((a, b) => {
								a = a.time;
								b = b.time;
	
								// check for undefined time, sort those at the end
								if ( (!a || isNaN(a)) && !(!b || isNaN(b))) return 1;
								if ( !(!a || isNaN(a)) && (!b || isNaN(b))) return -1;
								if ( (!a || isNaN(a)) && (!b || isNaN(b))) return 0;
	
								if (this.order != 0) {
									b = [a, a = b][0];
								}
	
								return a - b;
							});
						}
					} else {
						this.tradeList = [];
						this.$refs.msg.sendMessage('danger', 'Polldata is missing');
					}
					loadLock = false;
				})
				.catch((error) => {
					this.$refs.msg.sendMessage('danger', error);
				});
		},
		scroll() {
			window.onscroll = () => {
				const bottomOfWindow = Math.max(window.pageYOffset, document.documentElement.scrollTop, document.body.scrollTop) + window.innerHeight === document.documentElement.offsetHeight;
				if (bottomOfWindow&&!loadLock&& this.toShow < this.tradeCount) {
					const nuberToAdd = 50;
					this.loadTrades(this.toShow, nuberToAdd);
					this.toShow += nuberToAdd;
				}
			};
		}
	},
	watch: {
		order: function() {
			this.loadTrades(0, this.toShow);
		},
		search: function() {
			this.loadTrades(0, this.toShow);
		}
	},
	created() {
		this.loadTrades(0, this.toShow);
	},
	mounted() {
		this.scroll();
	}
}
</script>