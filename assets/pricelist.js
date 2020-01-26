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

    var datatable = $("table").DataTable();
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
            $("#autopricediv select").val(info.data('autoprice').toString());
            $('#priceModal').find("#priceminimum").val(info.data('min'));
            $('#priceModal').find("#pricemaximum").val(info.data('max'));
            $('#priceModal').modal('show');  
        }
    });

    // Handle delete request of selected items
    $('#frm').on('submit', function(e){
        // Prevent actual form submission
        e.preventDefault();
        var data = datatable.$('input').serializeArray();
  
        // Submit form data
        $.ajax({
            method: "POST",
            url: '/pricelist',
            data: data,
            success: function(response) {
                // Redirect and get qs in route
                window.location.href = 'http://localhost:3000/?removed=' + response.removed;
            }
        });
     });
});