const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const { register, login, getMe, changePassword } = require('../controllers/authController');

router.post('/register', register);
router.post('/login', login);
router.get('/me', authenticateToken, getMe);
router.put('/change-password', authenticateToken, changePassword);

module.exports = router;
