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

new Vue({
	el: '#app',
	components: {
		ItemGrid,
		msg
	},
	data: {
		tradeList: [],
		toShow: 50,
		search: '',
		order: 1,
		acceptedOnly: 0
	},
	methods: {
		loadTrades: function() {
			fetch('/trades?json=true')
				.then((response) => {
					return response.json();
				})
				.then((data) => {
					if (data.success) this.tradeList = data.data;
					else {
						this.tradeList = [];
						this.$refs.msg.sendMessage('danger', 'Polldata is missing');
					}
				})
				.catch((error) => {
					this.$refs.msg.sendMessage('danger', error);
				});
		},
		scroll() {
			window.onscroll = () => {
				const bottomOfWindow = Math.max(window.pageYOffset, document.documentElement.scrollTop, document.body.scrollTop) + window.innerHeight === document.documentElement.offsetHeight;
				if (bottomOfWindow) {
					this.toShow += 25;
				}
			};
		}
	},
	computed: {
		filteredTrades() {
			return this.tradeList.filter((trade) => {
				return ( (trade.id.indexOf(this.search.toLowerCase()) > -1) || (String(trade.partner).indexOf(this.search.toLowerCase()) > -1) ) && (trade.accepted || !this.acceptedOnly);
			});
		},
		sortedTrades() {
			return this.filteredTrades.sort((a, b) => {
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
			}).slice(0, this.toShow);
		}
	},
	created() {
		this.loadTrades();
	},
	mounted() {
		this.scroll();
	}
});
