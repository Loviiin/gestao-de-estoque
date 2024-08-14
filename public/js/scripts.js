document.addEventListener('DOMContentLoaded', (event) => {
    const form = document.getElementById('loginForm');
    const messageDiv = document.getElementById('message');

    form.addEventListener('submit', (event) => {
        event.preventDefault(); // Prevents the form from submitting the default way

        const formData = new FormData(form);
        const data = new URLSearchParams(formData).toString();

        fetch('/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: data,
        })
        .then(response => response.json())
        .then(result => {
            if (result.success) {
                const userType = result.userType;
                if (userType === 'admin') {
                    window.location.href = '/manager';
                } else {
                    window.location.href = '/employee';
                }
            } else {
                messageDiv.textContent = result.message;
            }
        })
        .catch(error => {
            console.error('Error:', error);
            messageDiv.textContent = 'Ocorreu um erro.';
        });
    });
});
