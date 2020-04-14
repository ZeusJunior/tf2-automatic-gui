let chart = {};


const app = new Vue({
	el: '#app',
	data: {
		toKeys: false,
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
		interval: 3600
	},
	methods: {
		refresh: function() {
			// TODO PARAMS
			start = moment(this.start).unix();
			end = moment(this.end).unix();
			$.ajax({
				type: 'GET',
				url: '/profit',
				data: {
					
					start: start,
					interval: Number(this.interval),
					end: end,
					json: true,
					toKeys: this.toKeys
				},
				success: function(data, status) {
					app.profit.profitTotal = data.data.profitTotal;
					app.profit.profitTimed = data.data.profitTimed;
					app.profit.numberOfTrades = data.data.numberOfTrades;
					app.profit.overpriceProfit = data.data.overpriceProfit;
					chart.data.datasets[0].data = []; // clear chart before reload
					chart.data.labels = [];
					data.data.profitPlot.forEach((element) => {
						chart.data.labels.push(moment.unix(element.time).format('D. M. Y H:mm:ss'));
						if (!app.toKeys) {
							chart.data.datasets[0].data.push(element.profit.toFixed(1));
						} else {
							chart.data.datasets[0].data.push(element.profit);
						}
					});
					chart.update();
				},
				dataType: 'json',
				traditional: true
			});
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
						display: true
					}]
				},
				aspectRatio: 3
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
