document.addEventListener('DOMContentLoaded', (event) => {
    console.log('Página carregada e pronta para uso.');

    // Seleciona o formulário de login
    const form = document.getElementById('loginForm');
    
    // Adiciona um ouvinte de evento para o envio do formulário
    form.addEventListener('submit', async (event) => {
        event.preventDefault(); // Previne o envio padrão do formulário

        // Obtém os dados do formulário
        const formData = new FormData(form);
        const data = Object.fromEntries(formData.entries());

        try {
            const response = await fetch('/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(data)
            });

            const result = await response.json();

            if (result.success) {
                // Redireciona com base no tipo de usuário
                if (result.userType === 'admin') {
                    window.location.href = '/manager';
                } else if (result.userType === 'employee') {
                    window.location.href = '/employee';
                }
            } else {
                // Exibe a mensagem de erro
                const messageContainer = document.querySelector('.message-container');
                messageContainer.innerHTML = `<div class="message alert alert-danger mt-3">${result.message}</div>`;
            }
        } catch (error) {
            console.error('Erro:', error);
        }
    });
    document.addEventListener('DOMContentLoaded', () => {
        const form = document.querySelector('.login100-form');
        form.addEventListener('submit', (e) => {
            e.preventDefault();
    
            const username = document.querySelector('input[name="username"]').value;
            const password = document.querySelector('input[name="pass"]').value;
    
            if (!username || !password) {
                alert('Usuário e senha são obrigatórios.');
                return;
            }
    
            // Simula envio para o servidor
            fetch('/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ username, password })
            })
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    if (data.userType === 'manager') {
                        window.location.href = '/manager';
                    } else {
                        window.location.href = '/employee';
                    }
                } else {
                    alert(data.message);
                }
            })
            .catch(error => console.error('Erro:', error));
        });
    });
    
});
