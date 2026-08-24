import { Router } from 'express';
import { calendarController } from '../controllers/calendar.controller.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();

// OAuth callback is called by Google redirect
router.get('/oauth-callback', (req, res) => calendarController.handleCallback(req, res));

// Authenticated routes
router.get('/auth-url', authenticate, (req, res) => calendarController.getAuthUrl(req, res));
router.get('/status', authenticate, (req, res) => calendarController.getStatus(req, res));

export default router;
