import express from 'express';
import { register, login, logout, getMe, googleLogin } from '../controllers/authController.js';
import { protect } from '../middleware/authMiddleware.js';
import { authLimiter } from '../middleware/rateLimiter.js';

const router = express.Router();

router.post('/register', authLimiter, register);
router.post('/login', authLimiter, login);
router.post('/google', authLimiter, googleLogin);
router.post('/logout', logout);
router.get('/me', protect, getMe);
router.get('/config', (req, res) => res.json({ success: true, googleClientId: process.env.GOOGLE_CLIENT_ID || '' }));

export default router;
