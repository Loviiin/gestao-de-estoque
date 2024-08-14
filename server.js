const express = require('express');
const path = require('path');
const fs = require('fs');
const app = express();
const PORT = process.env.PORT || 3000;

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));


// Configurações do Express
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.urlencoded({ extended: true }));
app.use(express.json()); // Adiciona suporte a JSON

// Rota para a página de login
app.get('/login', (req, res) => {
  res.sendFile(path.join(__dirname, 'views', 'login.html'));
});

// Rota para processar o login
app.post('/login', (req, res) => {
    const { username, password } = req.body;

    if (!username || !password) {
        return res.status(400).json({ success: false, message: 'Usuário e senha são obrigatórios.' });
    }

    const filePath = path.join(__dirname, 'data', 'users.json');

    fs.readFile(filePath, 'utf8', (err, data) => {
        if (err) {
            return res.status(500).json({ success: false, message: 'Erro ao ler o arquivo JSON.' });
        }

        let users;
        try {
            users = JSON.parse(data);
        } catch (parseError) {
            return res.status(500).json({ success: false, message: 'Erro ao analisar o arquivo JSON.' });
        }

        const user = users.find(u => u.username === username && u.password === password);

        if (user) {
            res.json({ success: true, userType: user.userType });
        } else {
            res.status(401).json({ success: false, message: 'Usuário ou senha inválidos.' });
        }
    });
});

// Rota para a página de cadastro
app.get('/register', (req, res) => {
    res.render('register'); // renderiza a página de registro
});

// Rota para processar o cadastro de novos usuários
app.post('/register', (req, res) => {
    const { username, password, userType } = req.body;

    // Verifica se username e password foram fornecidos
    if (!username || !password) {
        return res.status(400).json({ success: false, message: 'Usuário e senha são obrigatórios.' });
    }

    const filePath = path.join(__dirname, 'users.json');

    // Lê o arquivo JSON
    fs.readFile(filePath, 'utf8', (err, data) => {
        if (err) {
            return res.status(500).json({ success: false, message: 'Erro ao ler o arquivo JSON.' });
        }

        let users;
        try {
            users = JSON.parse(data);
        } catch (parseError) {
            return res.status(500).json({ success: false, message: 'Erro ao analisar o arquivo JSON.' });
        }

        // Verifica se o usuário já existe
        const existingUser = users.find(u => u.username === username);
        if (existingUser) {
            return res.status(400).json({ success: false, message: 'Usuário já existe.' });
        }

        // Adiciona o novo usuário ao array
        const newUser = { username, password, userType: userType || 'employee' };
        users.push(newUser);

        // Escreve de volta no arquivo JSON
        fs.writeFile(filePath, JSON.stringify(users, null, 2), (writeErr) => {
            if (writeErr) {
                return res.status(500).json({ success: false, message: 'Erro ao salvar o usuário.' });
            }

            res.status(201).json({ success: true, message: 'Usuário cadastrado com sucesso!' });
        });
    });
});

// Rota para a página do gerente
app.get('/manager', (req, res) => {
  res.send('Página do Gerente');
});

// Rota para a página do funcionário
app.get('/employee', (req, res) => {
  res.send('Página do Funcionário');
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
