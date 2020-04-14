$(document).ready(function() {
	$('#search')
		.focus(function() {
			$('.search-dropdown').show();
		})
		.focusout(function() {
			setTimeout(function() {
				$('.search-dropdown').hide();
			}, 200);
		});

	let typingTimer;
	const doneTypingInterval = 1000;
	const $input = $('#search');

	$input.on('keyup', function() {
		clearTimeout(typingTimer);
		typingTimer = setTimeout(function() {
			search($input.val());
		}, doneTypingInterval);
	});
 
	$input.on('keydown', function() {
		clearTimeout(typingTimer);
	});

	// eslint-disable-next-line require-jsdoc
	function search(text) {
		$.ajax({
			method: 'GET',
			url: '/search',
			data: {
				text
			},
			success: function(response) {
				let string = '';
				for (i = 0; i < response.results.length; i++) {
					string +=	'<li class="mini-price dropdown-item">' +
								'<a class="dropdown-item-link" href="/add-item?name=' + response.results[i].item_name + '">' +
									'<div class="item-mini"><img src="' + response.results[i].image_url + '"></div>' +
									'<div class="item_name">' + response.results[i].item_name + '</div>' +
								'</li>';
								
					if (i == 4 || i == response.results.length - 1) {
						$('.search-dropdown').html(string);
						break;
					}
				}
			}
		});
	}
});
