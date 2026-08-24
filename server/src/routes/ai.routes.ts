import { Router } from 'express';
import { aiController } from '../controllers/ai.controller.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();

router.use(authenticate);

router.post('/preview-symptoms', (req, res) => aiController.previewSymptoms(req, res));
router.post('/preview-notes', (req, res) => aiController.previewNotes(req, res));

export default router;
