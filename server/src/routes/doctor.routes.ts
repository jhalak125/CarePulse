import { Router } from 'express';
import { doctorController } from '../controllers/doctor.controller.js';
import { authenticate, requireRole } from '../middleware/auth.js';

const router = Router();

// Public doctor search and profile viewing
router.get('/', (req, res) => doctorController.getDoctors(req, res));
router.get('/:id', (req, res) => doctorController.getDoctorById(req, res));

// Availability lookup (optionally authenticated to detect holds by current user)
router.get('/:id/availability', (req, res, next) => {
  if (req.headers.authorization) {
    authenticate(req, res, () => doctorController.getDoctorAvailability(req, res));
  } else {
    doctorController.getDoctorAvailability(req, res);
  }
});

// Update doctor profile (Admin or Doctor)
router.put('/:id', authenticate, requireRole('DOCTOR', 'ADMIN'), (req, res) => {
  doctorController.updateDoctorProfile(req, res);
});

export default router;
