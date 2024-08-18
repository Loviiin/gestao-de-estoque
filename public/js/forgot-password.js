$(document).ready(function() {
    $('#forgotPasswordForm').on('submit', function(event) {
        event.preventDefault();

        const username = $('#username').val();

        $.ajax({
            type: 'POST',
            url: '/forgot-password',
            data: { username },
            success: function(response) {
                $('#message').text(response.message).addClass('alert alert-success');
            },
            error: function(xhr) {
                $('#message').text(xhr.responseJSON.message).addClass('alert alert-danger');
            }
        });
    });
});