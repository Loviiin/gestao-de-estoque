document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('loginForm');
    
    if (loginForm) {
        loginForm.addEventListener('submit', async (event) => {
            event.preventDefault(); // Impede o comportamento padrão do formulário

            const username = document.querySelector('input[name="username"]').value;
            const password = document.querySelector('input[name="password"]').value;

            try {
                const response = await fetch('/login', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ username, password })
                });

                const result = await response.json(); // Obtém a resposta JSON

                if (result.success) {
                    // Redireciona com base no tipo de usuário
                    if (result.userType === 'manager') {
                        window.location.href = '/manager';
                    } else if (result.userType === 'employee') {
                        window.location.href = '/employee';
                    }
                } else {
                    alert(result.message); // Mostra a mensagem de erro
                }
            } catch (error) {
                console.error('Erro ao fazer login:', error);
                alert('Erro ao processar o login.');
            }
        });
    }
});
