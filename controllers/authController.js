// controllers/authController.js
require('dotenv').config();
const path = require('path');
const admin = require('firebase-admin');
const nodemailer = require('nodemailer');
const crypto = require('crypto');
const { verifyPassword, hashPassword, generateRandomPassword } = require('../utils/passwordUtils'); // Importa as funções necessárias




// Inicialize o Firebase Admin SDK

admin.initializeApp({
    credential: admin.credential.cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    }),
    databaseURL: 'https://gestao-de-estoque-50baa.firebaseio.com'
});

const db = admin.firestore();
const usersCollection = db.collection('users');

// Funções de controle de autenticação
exports.loginPage = (req, res) => {
    res.sendFile(path.join(__dirname, '../views', 'login.html'));
};

exports.resetPasswordPage = (req, res) => {
    res.sendFile(path.join(__dirname, '../views', 'reset-password.html'));
};
exports.forgotPasswordPage = (req, res) => {
    res.sendFile(path.join(__dirname, '../views', 'forgot-password.html'));
};

// controllers/authController.js

exports.processLogin = async (req, res) => {
    const { username, password } = req.body;

    if (!username || !password) {
        return res.status(400).json({ success: false, message: 'Usuário e senha são obrigatórios.' });
    }

    try {
        // Remova o hífen do nome de usuário
        const sanitizedUsername = username.replace(/-/g, '');

        // Busca todos os restaurantes
        const restaurantsSnapshot = await db.collection('restaurants').get();
        let userDoc = null;

        // Itera sobre cada restaurante para encontrar o usuário
        for (const restaurant of restaurantsSnapshot.docs) {
            const employeesSnapshot = await restaurant.ref.collection('employees').where('username', '==', sanitizedUsername).get();
            if (!employeesSnapshot.empty) {
                userDoc = employeesSnapshot.docs[0];
                break;
            }
        }

        if (!userDoc) {
            return res.status(401).json({ success: false, message: 'Usuário ou senha inválidos.' });
        }

        const userData = userDoc.data();
        // Remova a verificação de senha com hash
        // const isPasswordValid = await verifyPassword(password, userData.password);
        if (password !== userData.password) {
            return res.status(401).json({ success: false, message: 'Usuário ou senha inválidos.' });
        }

        res.status(200).json({ success: true, message: 'Login bem-sucedido.', userType: userData.role });
    } catch (error) {
        console.error('Erro ao processar o login:', error);
        res.status(500).json({ success: false, message: 'Erro no servidor.' });
    }
};

exports.forgotPassword = async (req, res) => {
    const { username } = req.body;

    if (!username) {
        return res.status(400).json({ success: false, message: 'O nome de usuário é obrigatório.' });
    }

    try {
        // Remova o hífen do nome de usuário
        const sanitizedUsername = username.replace(/-/g, '');

        // Busca todos os restaurantes
        const restaurantsSnapshot = await db.collection('restaurants').get();
        let userDoc = null;

        // Itera sobre cada restaurante para encontrar o usuário
        for (const restaurant of restaurantsSnapshot.docs) {
            const employeesSnapshot = await restaurant.ref.collection('employees').where('username', '==', sanitizedUsername).get();
            if (!employeesSnapshot.empty) {
                userDoc = employeesSnapshot.docs[0];
                break;
            }
        }

        if (!userDoc) {
            return res.status(404).json({ success: false, message: 'Usuário não encontrado.' });
        }

        const token = crypto.randomBytes(20).toString('hex');
        const resetPasswordUrl = `http://${req.headers.host}/reset-password?token=${token}`;

        // Save the token and expiration time in the user's document
        await userDoc.ref.update({
            resetPasswordToken: token,
            resetPasswordExpires: Date.now() + 3600000 // 1 hour
        });

        // Send email with the reset link
        const transporter = nodemailer.createTransport({
            service: 'Gmail',
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS
            }
        });

        const mailOptions = {
            to: userDoc.data().email,
            from: process.env.EMAIL_USER,
            subject: 'Password Reset',
            text: `You are receiving this because you (or someone else) have requested the reset of the password for your account.\n\n
                   Please click on the following link, or paste this into your browser to complete the process:\n\n
                   ${resetPasswordUrl}\n\n
                   If you did not request this, please ignore this email and your password will remain unchanged.\n`
        };

        await transporter.sendMail(mailOptions);

        res.status(200).json({ success: true, message: 'Email de recuperação enviado.' });
    } catch (error) {
        console.error('Erro ao processar a solicitação de recuperação de senha:', error);
        res.status(500).json({ success: false, message: 'Erro no servidor.' });
    }
};

exports.resetPassword = async (req, res) => {
    const { token, newPassword } = req.body;

    if (!token || !newPassword) {
        return res.status(400).json({ success: false, message: 'Token e nova senha são obrigatórios.' });
    }

    try {
        const userDoc = await usersCollection.where('resetPasswordToken', '==', token)
                                             .where('resetPasswordExpires', '>', Date.now())
                                             .get();

        if (userDoc.empty) {
            return res.status(400).json({ success: false, message: 'Token inválido ou expirado.' });
        }

        const user = userDoc.docs[0];
        const hashedPassword = await hashPassword(newPassword);

        await usersCollection.doc(user.id).update({
            password: hashedPassword,
            resetPasswordToken: null,
            resetPasswordExpires: null
        });

        res.status(200).json({ success: true, message: 'Senha redefinida com sucesso.' });
    } catch (error) {
        console.error('Erro ao redefinir a senha:', error);
        res.status(500).json({ success: false, message: 'Erro no servidor.' });
    }
};

exports.registerRestaurantPage = (req, res) => {
    res.sendFile(path.join(__dirname, '../views', 'register_restaurant.html'));
};

exports.processRegisterRestaurant = async (req, res) => {
    const { restaurantName, restaurantEmail, restaurantState } = req.body;

    if (!restaurantName || !restaurantEmail || !restaurantState) {
        return res.status(400).json({ success: false, message: 'Todos os campos são obrigatórios.' });
    }

    try {
        const restaurantRef = db.collection('restaurants').doc();
        const ownerUsername = `owner${crypto.randomBytes(2).toString('hex')}`;
        const ownerPassword = generateRandomPassword();

        const ownerUser = {
            username: ownerUsername,
            password: ownerPassword,
            email: restaurantEmail, // Adiciona o campo de e-mail
            role: 'owner'
        };

        await restaurantRef.set({
            name: restaurantName,
            state: restaurantState,
            owner: ownerUsername
        });

        await restaurantRef.collection('employees').doc(ownerUsername).set(ownerUser);

        res.status(200).json({ success: true, message: 'Restaurante cadastrado com sucesso.', ownerUsername, ownerPassword });
    } catch (error) {
        console.error('Erro ao cadastrar restaurante:', error);
        res.status(500).json({ success: false, message: 'Erro no servidor.' });
    }
};


exports.managementPage = (req, res) => {
    res.sendFile(path.join(__dirname, '../public/sb-admin-2', 'index.html'));
};


// controllers/authController.js

// Função para listar funcionários
exports.listEmployeesPage = async (req, res) => {
    const { restaurantId } = req.params;

    try {
        const employeesSnapshot = await usersCollection.doc(restaurantId).collection('employees').get();
        const employees = employeesSnapshot.docs.map(doc => doc.data());

        res.status(200).json({ success: true, employees });
    } catch (error) {
        console.error('Erro ao listar funcionários:', error);
        res.status(500).json({ success: false, message: 'Erro no servidor.' });
    }
};

// Função para exibir o formulário de novo funcionário
exports.newEmployeePage = (req, res) => {
    res.render('new-employee');
};

// Função para criar um novo funcionário
exports.createEmployee = async (req, res) => {
    const { username, password, role } = req.body;
    // Remova a linha que faz o hash da senha
    // const hashedPassword = await hashPassword(password);
    await usersCollection.doc(username).set({ username, password, role });
    res.redirect('/employees');
};

// Função para exibir o formulário de edição de funcionário
exports.editEmployeePage = async (req, res) => {
    const { id } = req.params;
    const employeeDoc = await usersCollection.doc(id).get();
    if (!employeeDoc.exists) {
        return res.status(404).send('Funcionário não encontrado');
    }
    res.render('edit-employee', { employee: employeeDoc.data() });
};

// Função para atualizar um funcionário
exports.updateEmployee = async (req, res) => {
    const { id } = req.params;
    const { username, password, role } = req.body;
    // Remova a linha que faz o hash da senha
    // const hashedPassword = await hashPassword(password);
    await usersCollection.doc(id).update({ username, password, role });
    res.redirect('/employees');
};


