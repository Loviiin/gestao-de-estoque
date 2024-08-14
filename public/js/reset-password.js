$(document).ready(function() {
    $('#resetPasswordForm').on('submit', function(event) {
        event.preventDefault();
        
        const token = $('input[name="token"]').val(); // Agora puxa o token do formulário corretamente
        const newPassword = $('#newPassword').val();

        $.ajax({
            type: 'POST',
            url: '/reset-password',
            data: { token, newPassword },
            success: function(response) {
                $('#message').text(response.message).addClass('alert alert-success');
            },
            error: function(xhr) {
                $('#message').text(xhr.responseJSON.message).addClass('alert alert-danger');
            }
        });
    });
});
