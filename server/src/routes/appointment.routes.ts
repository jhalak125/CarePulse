import { Router } from 'express';
import { appointmentController } from '../controllers/appointment.controller.js';
import { authenticate, requireRole } from '../middleware/auth.js';

const router = Router();

router.use(authenticate);

// Slot holding & Booking
router.post('/hold', requireRole('PATIENT'), (req, res) => appointmentController.holdSlot(req, res));
router.post('/release-hold', requireRole('PATIENT'), (req, res) => appointmentController.releaseHold(req, res));
router.post('/confirm', requireRole('PATIENT'), (req, res) => appointmentController.confirmBooking(req, res));

// Appointment listing & details
router.get('/', (req, res) => appointmentController.getAppointments(req, res));
router.get('/:id', (req, res) => appointmentController.getAppointmentById(req, res));

// Reschedule & Cancel
router.post('/:id/reschedule', (req, res) => appointmentController.reschedule(req, res));
router.post('/:id/cancel', (req, res) => appointmentController.cancel(req, res));

// Doctor consultation submission (clinical notes + prescriptions + AI summary)
router.post('/:id/consultation', requireRole('DOCTOR'), (req, res) => appointmentController.submitConsultation(req, res));

// Patient Medication Tracking
router.get('/patient/medications', requireRole('PATIENT'), (req, res) => appointmentController.getPatientMedications(req, res));
router.post('/medications/:reminderId/taken', requireRole('PATIENT'), (req, res) => appointmentController.markMedicationTaken(req, res));

export default router;
