$(document).ready(function() {
	$('#autoprice').change(function() {
		const autoprice = $('#autoprice option:selected').val().toString();
		if (autoprice === 'true') {
			$('#prices').hide();
			$('#autoprice option[value=false]').removeAttr('selected');
			$('#autoprice option[value=true]').attr('selected', 'selected');
		} else {
			$('#prices').show();
			$('#sellkeys').prop('required', true);
			$('#sellmetal').prop('required', true);
			$('#buykeys').prop('required', true);
			$('#buymetal').prop('required', true);
			$('#autoprice option[value=true]').removeAttr('selected');
			$('#autoprice option[value=false]').attr('selected', 'selected');
		}
	});
});
