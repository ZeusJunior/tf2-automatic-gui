// scss
import './scss/profit.scss';

// vendor libraries
import 'bootstrap/js/dist/modal';
import 'bootstrap/js/dist/collapse';
import Vue from 'vue/dist/vue';
import axios from 'axios';
import moment from 'moment/';
import Chart from 'chart.js';
import Currencies from 'tf2-currencies';

// components
import msg from './components/msg.vue';


let chart = {};

const app = new Vue({
	el: '#app',
	components: {
		msg
	},
	data: {
		plotData: {},
		profit: {
			profitTotal: 0,
			profitTimed: 0,
			numberOfTrades: 0,
			overpriceProfit: 0
		},
		start: moment().subtract(7, 'days').startOf('day').utc().format('YYYY-MM-DDTHH:mm'),
		startTime: false,
		end: moment().utc().format('YYYY-MM-DDTHH:mm'),
		endTime: false,
		interval: 3600,
		msg: {
			text: '',
			type: '',
			enabled: false
		}
	},
	methods: {
		refresh: async function() {
			this.$refs.msg.sendMessage('primary', 'Loading');
			const start = moment(this.start).unix();
			const end = moment(this.end).unix();
			let resp;
			try {
				resp = await axios({
					method: 'get',
					url: '/profit',
					params: {
						start: start,
						interval: Number(this.interval),
						end: end,
						json: true
					}
				});
			} catch (err) {
				if (err.response) {
					app.sendMessage('danger', JSON.stringify(err.response.data));
				}
			}
			this.plotData = resp.data.data;
			if (resp.data.success == 0) {
				this.$refs.msg.sendMessage('danger', 'Failed: Missing polldata.json');
				return;
			}
			this.plotData = resp.data.data;
			this.$refs.msg.sendMessage('success', 'Loaded successfully');
			this.profit.profitTotal = this.plotData.profitTotal;
			this.profit.profitTimed = this.plotData.profitTimed;
			this.profit.numberOfTrades = this.plotData.numberOfTrades;
			this.profit.overpriceProfit = this.plotData.overpriceProfit;
			chart.data.datasets[0].data = []; // clear chart before reload
			chart.data.labels = [];
			for (let i = 0; i < this.plotData.profitPlot.length; i++) {
				const element = this.plotData.profitPlot[i];
				chart.data.labels.push(moment.unix(element.time).format('ddd D. M. Y H:mm:ss'));
				chart.data.datasets[0].data.push(element.profit);
			}
			chart.update();
		},
		/**
		 * Converts scrap to string - just some copypasta from tf2-currencies
		 * @param {Number} scrapVal 
		 * @return {String} formated currency
		 */
		currencyString: function(scrapVal) {
			if (!this.plotData.keyValue) this.plotData.keyValue = 1;
			const key = new Currencies({
				metal: this.plotData.keyValue
			}).toValue(this.plotData.keyValue); // get value in scrap 
			const metal = Currencies.toRefined(scrapVal % key);
			const keys = scrapVal>0 ? Math.floor(scrapVal / key) : Math.ceil(scrapVal / key);
			return new Currencies({keys, metal}).toString();
		}
	},
	mounted() {
		this.refresh();
		chart = new Chart(document.getElementById('myChart'), {
			// The type of chart we want to create
			type: 'bar',
		
			// The data for our dataset
			data: {
				labels: [],
				datasets: [{
					label: 'Profit',
					backgroundColor: 'rgb(71, 255, 0)',
					borderColor: 'rgb(0, 0, 0)',
					data: []
				}]
			},
		
			// Configuration options go here
			options: {
				responsive: true,
				title: {
					display: true,
					text: 'Profit'
				},
				scales: {
					xAxes: [{
						display: true
					}],
					yAxes: [{
						display: true,
						ticks: {
							// Include a dollar sign in the ticks
							callback: this.currencyString
						}
					}]
				},
				aspectRatio: 3,
				tooltips: {
					callbacks: {
						label: (item) => `${app.plotData.profitPlot[item.index].formated}`
					}
				}
			}
		});
	}
});
