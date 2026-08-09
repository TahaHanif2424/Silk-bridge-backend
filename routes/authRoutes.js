const express = require('express');
const router = express.Router();
const { register, login, logout, getMe, forgotPassword, resetPassword, sendRegistrationOtp } = require('../controllers/authController');
const { protect } = require('../middleware/auth');

router.post('/register', register);
router.post('/login', login);
router.post('/logout', logout);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);
router.post('/send-registration-otp', sendRegistrationOtp);
router.get('/me', protect, getMe);

module.exports = router;