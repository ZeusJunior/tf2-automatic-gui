$(document).ready(function() {
    $(".btn").attr("disabled", "disabled");
    $('[type=checkbox]').each(function(index, value) {
        $(this).click(function() {
            if ($(this).is(":checked")) {
                $(".btn").removeAttr("disabled");
            } else {
                $(".btn").attr("disabled", "disabled");
            }
        });
    })
});