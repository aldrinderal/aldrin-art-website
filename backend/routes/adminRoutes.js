const express = require('express');
const router = express.Router();
const { requireAdminAuth } = require('../middleware/auth');
const { login, getMe, logout } = require('../controllers/adminController');

// Public: Admin login with credentials
router.post('/login', login);

// Protected: Get current authenticated admin details
router.get('/me', requireAdminAuth, getMe);

// Protected: Admin logout
router.post('/logout', logout);

module.exports = router;
