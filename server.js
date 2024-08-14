const express = require('express');
const path = require('path');
const admin = require('firebase-admin');
const nodemailer = require('nodemailer');
const crypto = require('crypto');
const dotenv = require('dotenv');
dotenv.config(); // Carrega as variáveis de ambiente do arquivo .env

const app = express();
const PORT = process.env.PORT || 3000;

// Configuração do Firebase Admin SDK
const serviceAccount = require('./config/serviceAccountKey.json');

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: "https://gestao-de-estoque-50baa.firebaseio.com" // Corrigido para incluir o prefixo https://
});

const db = admin.firestore();
const usersCollection = db.collection('users');

// Configuração do Nodemailer
const transporter = nodemailer.createTransport({
    service: 'Gmail',
    auth: {
        user: process.env.EMAIL_USER, // Usar variáveis de ambiente
        pass: process.env.EMAIL_PASS  // Usar variáveis de ambiente
    }
});

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Rota para a página de login
app.get('/login', (req, res) => {
    res.sendFile(path.join(__dirname, 'views', 'login.html'));
});

// Rota para processar o login
app.post('/login', async (req, res) => {
    const { username, password } = req.body;

    if (!username || !password) {
        return res.status(400).json({ success: false, message: 'Usuário e senha são obrigatórios.' });
    }

    try {
        const userDoc = await usersCollection.doc(username).get();
        if (!userDoc.exists) {
            return res.status(401).json({ success: false, message: 'Usuário ou senha inválidos.' });
        }

        const user = userDoc.data();
        if (user.password === password) {
            res.json({ success: true, userType: user.userType });
        } else {
            res.status(401).json({ success: false, message: 'Usuário ou senha inválidos.' });
        }
    } catch (error) {
        res.status(500).json({ success: false, message: 'Erro ao processar o login.' });
    }
});

// Rota para a página de cadastro
app.get('/register', (req, res) => {
    res.render('register'); // Renderiza a página de registro
});

// Rota para processar o cadastro de novos usuários
app.post('/register', async (req, res) => {
    const { username, password, email, userType } = req.body;

    if (!username || !password || !email) {
        return res.status(400).json({ success: false, message: 'Usuário, senha e e-mail são obrigatórios.' });
    }

    try {
        const userDoc = await usersCollection.doc(username).get();
        if (userDoc.exists) {
            return res.status(400).json({ success: false, message: 'Usuário já existe.' });
        }

        await usersCollection.doc(username).set({
            password,
            email,
            userType: userType || 'employee'
        });

        res.status(201).json({ success: true, message: 'Usuário cadastrado com sucesso!' });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Erro ao salvar o usuário.' });
    }
});

// Rota para a página do gerente
app.get('/manager', (req, res) => {
    res.send('Página do Gerente');
});

// Rota para a página do funcionário
app.get('/employee', (req, res) => {
    res.send('Página do Funcionário');
});

// Rota para a página de recuperação de senha
app.get('/forgot-password', (req, res) => {
    res.sendFile(path.join(__dirname, 'views', 'forgot-password.html'));
});

// Rota para processar recuperação de senha
app.post('/forgot-password', async (req, res) => {
    const { username } = req.body;

    if (!username) {
        return res.status(400).json({ success: false, message: 'Username is required.' });
    }

    try {
        const userDoc = await usersCollection.doc(username).get();

        if (!userDoc.exists) {
            return res.status(404).json({ success: false, message: 'User not found.' });
        }

        const user = userDoc.data();

        const resetToken = crypto.randomBytes(32).toString('hex');

        await usersCollection.doc(username).update({
            resetToken
        });

        const resetLink = `http://localhost:${PORT}/reset-password?token=${resetToken}`;

        const mailOptions = {
            from: process.env.EMAIL_USER,
            to: user.email,
            subject: 'Password Recovery',
            text: `You requested a password reset. Click the link below to reset your password:\n\n${resetLink}`
        };

        await transporter.sendMail(mailOptions);

        res.json({ success: true, message: 'Password recovery instructions sent.' });

    } catch (error) {
        res.status(500).json({ success: false, message: 'Error processing password recovery.' });
    }
});

// Rota para a página de redefinição de senha
app.get('/reset-password', (req, res) => {
    res.sendFile(path.join(__dirname, 'views', 'reset-password.html'));
});

// Rota para processar a redefinição de senha
// Rota para processar a redefinição de senha
// Rota para processar a redefinição de senha
// Rota para processar a redefinição de senha
const staticToken = 'test-static-token'; // Defina um token estático para testes


app.post('/reset-password', async (req, res) => {
    const { token, newPassword } = req.body;

    try {
        const usersSnapshot = await usersCollection
            .where('resetToken', '==', token)
            .get();

        if (usersSnapshot.empty) {
            return res.status(400).json({ success: false, message: 'Invalid token.' });
        }

        const userDoc = usersSnapshot.docs[0];

        await userDoc.ref.update({
            password: newPassword,
            resetToken: null
        });

        res.status(200).json({ success: true, message: 'Password has been reset.' });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error resetting password.' });
    }
});




app.listen(PORT, () => {
    console.log(`Servidor rodando na porta ${PORT}`);
});
