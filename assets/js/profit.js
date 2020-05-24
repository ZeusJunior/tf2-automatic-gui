let chart = {};

const app = new Vue({
	el: '#app',
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
		startDateDialog: new mdDateTimePicker.default({
			type: 'date',
			init: moment().subtract(7, 'days').startOf('day'),
			future: moment()
		}),
		startTimeDialog: new mdDateTimePicker.default({
			type: 'time',
			mode: true
		}),
		end: moment().utc().format('YYYY-MM-DDTHH:mm'),
		endTime: false,
		endDateDialog: new mdDateTimePicker.default({
			type: 'date',
			init: moment()
		}),
		endTimeDialog: new mdDateTimePicker.default({
			type: 'time',
			mode: true
		}),
		interval: 3600,
		msg: {
			text: '',
			type: '',
			enabled: false
		}
	},
	methods: {
		sendMessage: function(type, text) {
			this.msg.enabled = true;
			this.msg.text = text;
			this.msg.type = type;
		},
		closeMessage: function() {
			this.msg.enabled = false;
		},
		refresh: async function() {
			this.sendMessage('primary', 'Loading');
			start = moment(this.start).unix();
			end = moment(this.end).unix();
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
				this.sendMessage('danger', 'Failed: Missing polldata.json');
				return;
			}
			this.plotData = resp.data.data;
			this.sendMessage('success', 'Loaded successfully');
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
		 * @return {String} formatted currency
		 */
		currencyString: function(scrapVal) {
			if (!this.plotData.keyValue) this.plotData.keyValue = 1;
			const key = new Currencies({
				metal: this.plotData.keyValue
			}).toValue(this.plotData.keyValue); // get value in scrap 
			const metal = Currencies.toRefined(scrapVal % key);
			const keys = scrapVal>0 ? Math.floor(scrapVal / key) : Math.ceil(scrapVal / key);
			return new Currencies({
				keys,
				metal
			}).toString();
		}
	},
	created() {
		this.refresh();
		this.endDateDialog.past = this.startDateDialog.time;
	},
	mounted() {
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
						label: (item) => `${app.plotData.profitPlot[item.index].formatted}`
					}
				}
			}
		});
	}
});

app.startDateDialog.trigger = document.getElementById('startTime');
app.startTimeDialog.trigger = document.getElementById('startTime');
document.getElementById('startTime').addEventListener('onOk', function() {
	if (!app.startTime) {
		app.startTime = true;
		app.startTimeDialog.toggle();
	} else {
		app.startTime = false;
		console.log(app.startDateDialog.time.utc().startOf('day').unix());
		const time = app.startTimeDialog.time;
		total = app.startDateDialog.time.utc().startOf('day').unix(); // add date to total
		total += time.startOf('minute').unix() - time.startOf('day').unix(); // add time to total
		app.start = moment.unix(total).utc().format('YYYY-MM-DDTHH:mm');
		app.refresh();
	}
});


app.endDateDialog.trigger = document.getElementById('endTime');
app.endTimeDialog.trigger = document.getElementById('endTime');
document.getElementById('endTime').addEventListener('onOk', function() {
	if (!app.endTime) {
		app.endTime = true;
		app.endTimeDialog.toggle();
	} else {
		app.endTime = false;
		console.log(app.endDateDialog.time.utc().startOf('day').unix());
		const time = app.endTimeDialog.time;
		total = app.endDateDialog.time.utc().startOf('day').unix(); // add date to total
		total += time.startOf('minute').unix() - time.startOf('day').unix(); // add time to total
		app.end = moment.unix(total).utc().format('YYYY-MM-DDTHH:mm');
		app.refresh();
	}
});
