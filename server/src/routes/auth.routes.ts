import { Router } from 'express';
import { authController } from '../controllers/auth.controller.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();

router.post('/register', (req, res) => authController.register(req, res));
router.post('/login', (req, res) => authController.login(req, res));
router.post('/demo-login', (req, res) => authController.demoLogin(req, res));
router.get('/me', authenticate, (req, res) => authController.getMe(req, res));

export default router;
