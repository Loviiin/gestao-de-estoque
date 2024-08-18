const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { isManager } = require('../middlewares/permissions');


router.get('/login', authController.loginPage);
router.post('/login', authController.processLogin);
router.get('/forgot-password', authController.forgotPasswordPage);
router.post('/forgot-password', authController.forgotPassword);
router.get('/reset-password', authController.resetPasswordPage);
router.post('/reset-password', authController.resetPassword);
router.get('/register_restaurant', authController.registerRestaurantPage);
router.post('/register_restaurant', authController.processRegisterRestaurant);
router.get('/restaurants/:restaurantId/employees', authController.listEmployeesPage);
router.get('/management', authController.managementPage);

// Rotas para gerenciamento de funcionários
router.get('/employees', isManager, authController.listEmployeesPage);
router.get('/employees/new', isManager, authController.newEmployeePage);
router.post('/employees', isManager, authController.createEmployee);
router.get('/employees/:id/edit', isManager, authController.editEmployeePage);
router.post('/employees/:id', isManager, authController.updateEmployee);



module.exports = router;