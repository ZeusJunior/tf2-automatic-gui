new Vue({
	el: '#app',
	data: {
		tradeList: [],
		toShow: 50,
		search: '',
		order: 0,
		acceptedOnly: 0
	},
	methods: {
		loadTrades: function() {
			fetch('/trades?json=true')
				.then((response) => {
					return response.json();
				})
				.then((data) => {
					this.tradeList = data.data;
				})
				.catch((error) => {
					console.error('Error:', error);
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
				if ( (isNaN(a) || typeof a == 'undefined') && !(isNaN(b) || typeof b == 'undefined')) return 1;
				if ( !(isNaN(a) || typeof a == 'undefined') && (isNaN(b) || typeof b == 'undefined')) return -1;
				if ( (isNaN(a) || typeof a == 'undefined') && (isNaN(b) || typeof b == 'undefined')) return 0;

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
