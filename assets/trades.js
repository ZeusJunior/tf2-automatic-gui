$(document).ready(function() {
	// eslint-disable-next-line new-cap
	$('table').DataTable({
		lengthMenu: [[10, 25, 50, -1], [10, 25, 50, 'All']]
	});

	$('.dataTables_length').addClass('bs-select');

	$('.table > tbody').on('mouseenter', 'tr', function(event) {
		$(this).css('cursor', 'pointer');
	});

	$('.table > tbody').on('click', 'tr', function(event) {
		const info = $(this);
		const firstcell= $(event.target).closest('td');
		if (firstcell.index() > 0) {
			// Set some values
			$('#tradeModal').find('#offerid').val(info.data('offerid'));
			$('#tradeModal').find('#partner').val(info.data('partner'));
			$('#tradeModal').modal('show');
		}
	});
});
