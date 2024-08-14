const express = require('express');
const path = require('path');
const bodyParser = require('body-parser');
const { MongoClient } = require('mongodb');

const app = express();
const port = 3000;

// Configura a engine de views para EJS
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

app.use(express.static(path.join(__dirname, 'public')));

// Conectar ao MongoDB
const uri = "mongodb://localhost:27017";
const client = new MongoClient(uri, { useUnifiedTopology: true });

client.connect(err => {
    if (err) {
        console.error('Erro ao conectar ao MongoDB', err);
        process.exit(1);
    }
    console.log('Conectado ao MongoDB');

    // Inicia o servidor depois de conectar ao MongoDB
    app.listen(port, () => {
        console.log(`Servidor rodando na porta ${port}`);
    });
});

// Rota para a página de login
app.get('/login', (req, res) => {
    res.render('login'); // Renderiza a página de login
});

// Rota para a página de registro
app.get('/register', (req, res) => {
    res.render('register'); // Renderiza a página de registro
});