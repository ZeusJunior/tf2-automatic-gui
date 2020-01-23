$(document).ready(function() {
    $("#removeBtn").attr("disabled", "disabled");
    $('[type=checkbox]').each(function(index, value) {
        $(this).click(function() {
            if ($("#frm input:checkbox:checked").length > 0) {
                $("#removeBtn").removeAttr("disabled");
            } else {
                $("#removeBtn").attr("disabled", "disabled");
            }
        });
    })

    $("table").DataTable();
    $('.dataTables_length').addClass('bs-select');

    $('.table > tbody').on('mouseenter', 'tr', function(event) {
        $(this).css('cursor', 'pointer');
    });

    $('.table > tbody').on('click', 'tr', function(event) {
        var info = $(this);
        var firstcell= $(event.target).closest('td');
        if (firstcell.index() > 0) {
            // Set some values
            $("#priceModal").find("#pricesku").val(info.data('sku'));
            $("#priceModal").find("#pricename").val(info.data('name'));
            $('#priceModal').find("#sellkeys").val(info.data('sell_keys'));
            $('#priceModal').find("#sellmetal").val(info.data('sell_metal'));
            $('#priceModal').find("#buykeys").val(info.data('buy_keys'));
            $('#priceModal').find("#buymetal").val(info.data('buy_metal'));
            $("#priceintentdiv select").val(info.data('intent'));
            $('#priceModal').find("#priceminimum").val(info.data('min'));
            $('#priceModal').find("#pricemaximum").val(info.data('max'));
            $('#priceModal').modal('show');  
        }
    });
});