import { Router } from 'express';
import { leaveController } from '../controllers/leave.controller.js';
import { authenticate, requireRole } from '../middleware/auth.js';

const router = Router();

router.use(authenticate);

router.post('/', requireRole('DOCTOR', 'ADMIN'), (req, res) => leaveController.applyLeave(req, res));
router.post('/preview', requireRole('DOCTOR', 'ADMIN'), (req, res) => leaveController.previewConflicts(req, res));
router.get('/', (req, res) => leaveController.getLeaves(req, res));
router.delete('/:id', requireRole('DOCTOR', 'ADMIN'), (req, res) => leaveController.deleteLeave(req, res));

export default router;
