const express = require('express');
const router = express.Router();
const authController = require('../controllers/auth.controller');
const { protect, authorize } = require('../middlewares/auth.middleware');
const { validateRegister, validateLogin, validateUpdateUser } = require('../validators/auth.validator');
const { ROLES } = require('../constants/roles');

// 1. First Super Admin Self-Registration (Public API - Allows creating SUPER_ADMIN once/directly)
router.post('/create-super-admin', validateRegister, authController.createSuperAdmin);

// 2. Login (For Super Admin, Owner, Resident)
router.post('/login', validateLogin, authController.login);

// 3. Super Admin creates PG Owner (Protected - Requires Super Admin Token)
router.post(
  '/create-owner',
  protect,
  authorize(ROLES.SUPER_ADMIN),
  validateRegister,
  authController.createOwner
);

// 4. User Profile (Protected)
router.get('/profile', protect, authController.getProfile);
router.patch('/profile', protect, validateUpdateUser, authController.updateProfile);

module.exports = router;
