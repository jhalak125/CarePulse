import { Router } from 'express';
import { adminController } from '../controllers/admin.controller.js';
import { authenticate, requireRole } from '../middleware/auth.js';

const router = Router();

router.use(authenticate);
router.use(requireRole('ADMIN'));

router.get('/stats', (req, res) => adminController.getDashboardStats(req, res));
router.get('/emails', (req, res) => adminController.getEmailLogs(req, res));
router.post('/emails/:id/retry', (req, res) => adminController.retryEmail(req, res));
router.post('/doctors', (req, res) => adminController.createDoctor(req, res));

export default router;
