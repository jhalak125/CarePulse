import { Request, Response } from 'express';
import { prisma } from '../prisma.js';
import { bookingService } from '../services/booking.service.js';

export class AppointmentController {
  public async holdSlot(req: Request, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, message: 'Authentication required.' });
        return;
      }

      const { doctorId, date, startTime, endTime } = req.body;
      if (!doctorId || !date || !startTime || !endTime) {
        res.status(400).json({ success: false, message: 'doctorId, date, startTime, and endTime are required.' });
        return;
      }

      const hold = await bookingService.holdSlot({
        doctorId,
        patientId: req.user.id,
        date,
        startTime,
        endTime,
      });

      res.status(201).json({ success: true, message: 'Slot held for 10 minutes.', hold });
    } catch (err: any) {
      res.status(400).json({ success: false, message: err.message });
    }
  }

  public async releaseHold(req: Request, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, message: 'Authentication required.' });
        return;
      }

      const { holdId } = req.body;
      if (!holdId) {
        res.status(400).json({ success: false, message: 'holdId is required.' });
        return;
      }

      const released = await bookingService.releaseHold(holdId, req.user.id);
      res.json({ success: true, released });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  }

  public async confirmBooking(req: Request, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, message: 'Authentication required.' });
        return;
      }

      const { holdId, symptoms } = req.body;
      if (!holdId || !symptoms || !symptoms.trim()) {
        res.status(400).json({ success: false, message: 'holdId and symptoms are required.' });
        return;
      }

      const appointment = await bookingService.confirmBooking({
        holdId,
        patientId: req.user.id,
        symptoms: symptoms.trim(),
      });

      res.status(201).json({
        success: true,
        message: 'Appointment confirmed successfully!',
        appointment,
      });
    } catch (err: any) {
      res.status(400).json({ success: false, message: err.message });
    }
  }

  public async getAppointments(req: Request, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, message: 'Unauthorized' });
        return;
      }

      const { status, date, urgency } = req.query;
      const whereClause: any = {};

      if (req.user.role === 'PATIENT') {
        whereClause.patientId = req.user.id;
      } else if (req.user.role === 'DOCTOR') {
        const doctor = await prisma.doctorProfile.findUnique({ where: { userId: req.user.id } });
        if (!doctor) {
          res.status(404).json({ success: false, message: 'Doctor profile not found' });
          return;
        }
        whereClause.doctorId = doctor.id;
      }

      if (status && typeof status === 'string' && status !== 'ALL') {
        whereClause.status = status;
      }

      if (date && typeof date === 'string') {
        whereClause.date = date;
      }

      if (urgency && typeof urgency === 'string') {
        whereClause.urgencyLevel = urgency;
      }

      const appointments = await prisma.appointment.findMany({
        where: whereClause,
        include: {
          patient: { select: { id: true, name: true, email: true, phone: true } },
          doctor: { include: { user: { select: { id: true, name: true, email: true } } } },
          prescriptions: { include: { reminders: true } },
        },
        orderBy: [{ date: 'desc' }, { startTime: 'desc' }],
      });

      res.json({ success: true, appointments });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  }

  public async getAppointmentById(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      const appointment = await prisma.appointment.findUnique({
        where: { id },
        include: {
          patient: { select: { id: true, name: true, email: true, phone: true } },
          doctor: { include: { user: { select: { id: true, name: true, email: true } } } },
          prescriptions: { include: { reminders: true } },
        },
      });

      if (!appointment) {
        res.status(404).json({ success: false, message: 'Appointment not found' });
        return;
      }

      // Parse JSON fields
      let parsedQuestions = [];
      let parsedFollowUp = [];
      try {
        if (appointment.suggestedQuestions) parsedQuestions = JSON.parse(appointment.suggestedQuestions);
      } catch (_) {}
      try {
        if (appointment.followUpSteps) parsedFollowUp = JSON.parse(appointment.followUpSteps);
      } catch (_) {}

      res.json({
        success: true,
        appointment: {
          ...appointment,
          suggestedQuestionsArray: parsedQuestions,
          followUpStepsArray: parsedFollowUp,
        },
      });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  }

  public async reschedule(req: Request, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, message: 'Unauthorized' });
        return;
      }

      const { id } = req.params;
      const { newDate, newStartTime, newEndTime } = req.body;

      if (!newDate || !newStartTime || !newEndTime) {
        res.status(400).json({ success: false, message: 'newDate, newStartTime, and newEndTime are required.' });
        return;
      }

      const updated = await bookingService.rescheduleAppointment({
        appointmentId: id,
        patientId: req.user.id,
        newDate,
        newStartTime,
        newEndTime,
      });

      res.json({ success: true, message: 'Appointment successfully rescheduled.', appointment: updated });
    } catch (err: any) {
      res.status(400).json({ success: false, message: err.message });
    }
  }

  public async cancel(req: Request, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, message: 'Unauthorized' });
        return;
      }

      const { id } = req.params;
      const { reason } = req.body;

      const cancelled = await bookingService.cancelAppointment({
        appointmentId: id,
        userId: req.user.id,
        role: req.user.role,
        reason,
      });

      res.json({ success: true, message: 'Appointment cancelled.', appointment: cancelled });
    } catch (err: any) {
      res.status(400).json({ success: false, message: err.message });
    }
  }

  public async submitConsultation(req: Request, res: Response): Promise<void> {
    try {
      if (!req.user || req.user.role !== 'DOCTOR') {
        res.status(403).json({ success: false, message: 'Only authorized doctors can submit consultation notes.' });
        return;
      }

      const { id } = req.params;
      const { clinicalNotes, prescriptions } = req.body;

      if (!clinicalNotes || !clinicalNotes.trim()) {
        res.status(400).json({ success: false, message: 'Clinical notes are required.' });
        return;
      }

      const doctor = await prisma.doctorProfile.findUnique({ where: { userId: req.user.id } });
      if (!doctor) {
        res.status(404).json({ success: false, message: 'Doctor profile not found.' });
        return;
      }

      const result = await bookingService.submitConsultation({
        appointmentId: id,
        doctorId: doctor.id,
        clinicalNotes: clinicalNotes.trim(),
        prescriptions,
      });

      res.json({
        success: true,
        message: 'Consultation completed and AI post-visit plan generated!',
        result,
      });
    } catch (err: any) {
      res.status(400).json({ success: false, message: err.message });
    }
  }

  public async markMedicationTaken(req: Request, res: Response): Promise<void> {
    try {
      const { reminderId } = req.params;

      const updated = await prisma.medicationReminder.update({
        where: { id: reminderId },
        data: {
          status: 'TAKEN',
          takenAt: new Date(),
        },
      });

      res.json({ success: true, message: 'Medication recorded as taken.', reminder: updated });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  }

  public async getPatientMedications(req: Request, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, message: 'Unauthorized' });
        return;
      }

      const today = new Date().toISOString().split('T')[0];

      const prescriptions = await prisma.prescription.findMany({
        where: {
          appointment: { patientId: req.user.id },
        },
        include: {
          appointment: {
            include: { doctor: { include: { user: true } } },
          },
          reminders: {
            orderBy: [{ scheduledDate: 'desc' }, { scheduledTime: 'asc' }],
          },
        },
        orderBy: { createdAt: 'desc' },
      });

      const todayReminders = await prisma.medicationReminder.findMany({
        where: {
          patientId: req.user.id,
          scheduledDate: today,
        },
        include: { prescription: true },
        orderBy: { scheduledTime: 'asc' },
      });

      res.json({
        success: true,
        prescriptions,
        todayReminders,
      });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  }
}

export const appointmentController = new AppointmentController();
