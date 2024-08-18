// utils/passwordUtils.js
const crypto = require('crypto');

exports.generateRandomPassword = () => {
    return crypto.randomBytes(2).toString('hex'); // Gera uma senha aleatória de 16 caracteres
};

// Remova ou comente as funções de hash e verificação de senha
// const bcrypt = require('bcrypt');

// exports.hashPassword = async (password) => {
//     const saltRounds = 10;
//     return await bcrypt.hash(password, saltRounds);
// };

// exports.verifyPassword = async (password, hashedPassword) => {
//     try {
//         return await bcrypt.compare(password, hashedPassword);
//     } catch (error) {
//         console.error('Erro ao verificar a senha:', error);
//         throw new Error('Erro ao verificar a senha');
//     }
// };