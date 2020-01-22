$(document).ready(function() {
    $("#removeBtn").attr("disabled", "disabled");
    $('[type=checkbox]').each(function(index, value) {
        $(this).click(function() {
            if ($(this).is(":checked")) {
                $("#removeBtn").removeAttr("disabled");
            } else {
                $("#removeBtn").attr("disabled", "disabled");
            }
        });
    })

    $("table").DataTable();
    $('.dataTables_length').addClass('bs-select');
});