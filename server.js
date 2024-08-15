const express = require('express');
const path = require('path');
const admin = require('firebase-admin');
const nodemailer = require('nodemailer');
const crypto = require('crypto');
const dotenv = require('dotenv');
const app = express();
const PORT = process.env.PORT || 3000;


dotenv.config();


const serviceAccount = require('./config/serviceAccountKey.json');

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: "https://gestao-de-estoque-50baa.firebaseio.com"
});

const db = admin.firestore();
const usersCollection = db.collection('users');

// Configuração do Nodemailer
const transporter = nodemailer.createTransport({
    service: 'Gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Rota login
app.get('/login', (req, res) => {
    res.sendFile(path.join(__dirname, 'views', 'login.html'));
});

// Rota processar o login
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

// Rota página de cadastro
app.get('/register', (req, res) => {
    res.render('register');
});

// Rota novos usuários
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
            userType: userType || 'employee',
            resetToken: '',
        });

        res.status(201).json({ success: true, message: 'Usuário cadastrado com sucesso!' });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Erro ao salvar o usuário.' });
    }
});

app.get('/manager', (req, res) => {
    res.sendFile(path.join(__dirname, 'views', 'manager.html'));
});
app.get('/manager.html', (req, res) => {
    res.sendFile(path.join(__dirname, 'views', 'manager.html'));
});


app.get('/employee', (req, res) => {
    res.send('Página do Funcionário');
});


app.get('/forgot-password', (req, res) => {
    res.sendFile(path.join(__dirname, 'views', 'forgot-password.html'));
});


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
            resetToken,
            resetTokenExpiry: null
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
        console.error('Error sending email:', error);
        res.status(500).json({ success: false, message: 'Error processing password recovery.' });
    }
});

app.get('/reset-password', (req, res) => {
    res.sendFile(path.join(__dirname, 'views', 'reset-password.html'));
});

app.post('/reset-password', async (req, res) => {
    const { token, newPassword } = req.body;
    if (!token || !newPassword) {
        return res.status(400).json({ success: false, message: 'Token and new password are required.' });
    }
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
        console.error('Error resetting password:', error);
        res.status(500).json({ success: false, message: 'Error resetting password.' });
    }
});


app.listen(PORT, () => {
    console.log(`Servidor rodando na porta ${PORT}`);
});


app.get('/register_dish.html', (req, res) => {
    res.sendFile(path.join(__dirname, 'views', 'register_dish.html'));
});


app.post('/register_dish', async (req, res) => {
    const { dishName, ingredients } = req.body;

    if (!dishName || !ingredients || ingredients.length === 0) {
        return res.status(400).send('Missing required fields');
    }

    try {
        const ingredientsCollection = await db.collection('ingredients').get();
        const availableIngredients = new Set(ingredientsCollection.docs.map(doc => doc.id));
        
        const invalidIngredients = ingredients.filter(ingredient => !availableIngredients.has(ingredient.name));
        if (invalidIngredients.length > 0) {
            return res.status(400).send('Some ingredients are not registered');
        }

        await db.collection('dishes').doc(dishName).set({
            ingredients: ingredients
        });

        res.redirect('/manager.html');
    } catch (error) {
        console.error('Error inserting dish', error.message);
        res.status(500).send('Error inserting dish');
    }
});


app.get('/register_ingredients.html', (req, res) => {
    res.sendFile(path.join(__dirname, 'views', 'register_ingredients.html'));
  });
  

  app.post('/register_ingredients', async (req, res) => {
    const { name, quantity, unit } = req.body;

    if (!name || quantity === undefined || !unit) {
        return res.status(400).send('Missing required fields');
    }

    try {
        await db.collection('ingredients').doc(name).set({
            quantity: quantity,
            unit: unit
        });
        res.redirect('/register_ingredients.html'); 
    } catch (error) {
        console.error('Error inserting ingredient', error.message);
        res.status(500).send('Error inserting ingredient');
    }
});



app.post('/update_ingredient', async (req, res) => {
    const { name, quantity, unit } = req.body;

    if (!name || quantity === undefined || !unit) {
        return res.status(400).send('Missing required fields');
    }

    try {
        await db.collection('ingredients').doc(name).update({
            quantity: quantity,
            unit: unit
        });
        res.redirect('/manager.html');
    } catch (error) {
        console.error('Error updating ingredient', error.message);
        res.status(500).send('Error updating ingredient');
    }
});


app.post('/delete_ingredient', async (req, res) => {
    const { name } = req.body;

    if (!name) {
        return res.status(400).send('Missing ingredient name');
    }

    try {
        await db.collection('ingredients').doc(name).delete();
        res.redirect('/manager.html');
    } catch (error) {
        console.error('Error deleting ingredient', error.message);
        res.status(500).send('Error deleting ingredient');
    }
});

app.post('/update_dish', async (req, res) => {
    const { dishName, ingredients } = req.body;

    if (!dishName || !ingredients || ingredients.length === 0) {
        return res.status(400).send('Missing required fields');
    }

    try {
        const ingredientsCollection = await db.collection('ingredients').get();
        const availableIngredients = new Set(ingredientsCollection.docs.map(doc => doc.id));
        
        const invalidIngredients = ingredients.filter(ingredient => !availableIngredients.has(ingredient.name));
        if (invalidIngredients.length > 0) {
            return res.status(400).send('Some ingredients are not registered');
        }


        await db.collection('dishes').doc(dishName).update({
            ingredients: ingredients
        });
        res.redirect('/manager.html');
    } catch (error) {
        console.error('Error updating dish', error.message);
        res.status(500).send('Error updating dish');
    }
});


app.get('/delete_dish.html', (req, res) => {
    res.sendFile(path.join(__dirname, 'views', 'delete_dish.html'));
  });

  

app.post('/delete_dish', async (req, res) => {
    const { name } = req.body;

    if (!name) {
        return res.status(400).send('Missing dish name');
    }

    const db = admin.firestore();

    try {
        const dishRef = db.collection('dishes').doc(name);
        await dishRef.delete();

   
        const ingredientsRef = db.collection('ingredients');

        res.redirect('/search_dish.html');
    } catch (error) {
        console.error('Error deleting dish:', error);
        res.status(500).send('Error deleting dish');
    }
});


app.get('/search_ingredient', async (req, res) => {
    const { name } = req.query;

    if (!name) {
        return res.status(400).send('Missing ingredient name');
    }

    try {
        const doc = await db.collection('ingredients').doc(name).get();
        if (!doc.exists) {
            return res.status(404).send('Ingredient not found');
        }
        res.json(doc.data());
    } catch (error) {
        console.error('Error searching ingredient', error.message);
        res.status(500).send('Error searching ingredient');
    }
});

app.get('/search_dish', async (req, res) => {
    const { name } = req.query;

    if (!name) {
        return res.status(400).send('Missing dish name');
    }

    const db = admin.firestore();

    try {
        const dishesRef = db.collection('dishes');
        const query = dishesRef.where('name', '==', name);
        const querySnapshot = await query.get();

        if (querySnapshot.empty) {
            return res.json([]);
        }

        const dishes = [];
        querySnapshot.forEach(doc => {
            dishes.push(doc.data());
        });

        res.json(dishes);
    } catch (error) {
        console.error('Error fetching dishes:', error);
        res.status(500).send('Error fetching dishes');
    }
});


