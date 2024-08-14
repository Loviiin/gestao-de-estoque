$(document).ready(function() {
    $('#forgotPasswordForm').on('submit', function(event) {
        event.preventDefault();
        
        const username = $('#username').val();
        
        $.ajax({
            type: 'POST',
            url: '/forgot-password',
            contentType: 'application/json', // Especifica que o tipo de conteúdo é JSON
            data: JSON.stringify({ username }), // Converte os dados para JSON
            success: function(response) {
                $('#message').text(response.message).addClass('alert alert-success');
            },
            error: function(xhr) {
                $('#message').text(xhr.responseJSON.message).addClass('alert alert-danger');
            }
        });
    });
});
