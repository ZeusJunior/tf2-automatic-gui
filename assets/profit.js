const ctx = document.getElementById('myChart').getContext('2d');
const chart = new Chart(ctx, {
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
		}
	}
});

/**
 * aaa
 */
function refresh() {
	// TODO PARAMS
	start = moment($('#start').val()).unix();
	end = moment($('#end').val()).unix();
	$.ajax({
		type: 'GET',
		url: '/profit',
		data: {
			
			start: start,
			//          interval: interval,
			end: end
		},
		success: function(data, status) {
			app.sendMessage(data.msg.type, data.msg.message);
			app.loadItems();
		},
		dataType: 'json',
		traditional: true
	});
	fetch('/profit?interval=3600&json=true')// start=1585699200&end=1585872000&
		.then((response) => {
			return response.json();
		})
		.then((data) => {
			data.data.profitPlot.forEach((element) => {
				chart.data.labels.push(moment.unix(element.time).format('D. M. Y H:mm:ss'));
				chart.data.datasets[0].data.push(element.profit);
			});
			chart.update();
		})
		.catch((error) => {
			console.error('Error:', error);
		});
}
