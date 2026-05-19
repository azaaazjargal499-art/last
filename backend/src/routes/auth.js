// smart-inventory/backend/src/routes/auth.js
const router = require('express').Router();
const { register, login, googleStart, googleCallback, getProfile, updateProfile } = require('../controllers/authController');
const { protect } = require('../middleware/auth');

router.post('/register', register);
router.post('/login', login);
router.get('/google', googleStart);
router.get('/google/callback', googleCallback);
router.get('/me', protect, getProfile);
router.put('/profile', protect, updateProfile);

module.exports = router;
