import './scss/trades.scss';

// vendor libraries
import 'bootstrap/js/dist/modal';
import 'bootstrap/js/dist/collapse';
import Vue from 'vue/dist/vue';

// components
import ItemGrid from './components/item-grid.vue';
import msg from './components/msg.vue';

// scroll button
import './js/scrollButton';

let loadLock = false; // to prevent multiple requests from being fired while waiting for one to return

new Vue({
	el: '#app',
	components: {
		ItemGrid,
		msg
	},
	data: {
		tradeList: [],
		items: [],
		toShow: 50,
		search: '',
		order: 1,
		acceptedOnly: 0,
		tradeCount: 0
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
});
