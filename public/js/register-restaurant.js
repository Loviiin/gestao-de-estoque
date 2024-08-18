document.getElementById('register-restaurant-form').addEventListener('submit', async (event) => {
    event.preventDefault();

    const restaurantName = document.getElementById('restaurant-name').value;
    const restaurantState = document.getElementById('restaurant-state').value;

    const response = await fetch('/register_restaurant', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ restaurantName, restaurantState })
    });

    const result = await response.json();
    if (result.success) {
        alert(`Restaurante cadastrado com sucesso! Login: ${result.ownerUsername}, Senha: ${result.ownerPassword}`);
    } else {
        alert('Erro ao cadastrar restaurante: ' + result.message);
    }
});