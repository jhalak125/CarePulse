import { prisma } from '../prisma.js';
import { ENV } from '../config/env.js';
import { aiService } from './ai.service.js';
import { emailService } from './email.service.js';
import { calendarService } from './calendar.service.js';
import { isDateInRange } from '../utils/dateUtils.js';
import { logger } from '../utils/logger.js';

export class BookingService {
  /**
   * Holds a slot for 10 minutes to prevent race conditions during symptom entry
   */
  public async holdSlot(params: {
    doctorId: string;
    patientId: string;
    date: string; // YYYY-MM-DD
    startTime: string; // HH:mm
    endTime: string; // HH:mm
  }) {
    const now = new Date();

    // 1. Check if doctor is on approved leave on this date
    const leaves = await prisma.doctorLeave.findMany({
      where: {
        doctorId: params.doctorId,
        status: 'APPROVED',
      },
    });

    const onLeave = leaves.some((l) => isDateInRange(params.date, l.startDate, l.endDate));
    if (onLeave) {
      throw new Error('Doctor is on approved leave on this date. Please select another date.');
    }

    // 2. Check if an active confirmed appointment already occupies this slot
    const existingAppointment = await prisma.appointment.findFirst({
      where: {
        doctorId: params.doctorId,
        date: params.date,
        startTime: params.startTime,
        status: {
          in: ['CONFIRMED'],
        },
      },
    });

    if (existingAppointment) {
      throw new Error('This slot is already booked. Please choose another time slot.');
    }

    // 3. Check if another patient has an active unexpired hold on this exact slot
    const existingHold = await prisma.slotHold.findFirst({
      where: {
        doctorId: params.doctorId,
        date: params.date,
        startTime: params.startTime,
        status: 'ACTIVE',
        expiresAt: { gt: now },
        patientId: { not: params.patientId },
      },
    });

    if (existingHold) {
      throw new Error('This slot is temporarily held by another patient. Please choose another slot or retry in a few moments.');
    }

    // 4. Release any other active holds this patient currently has to keep slots free
    await prisma.slotHold.updateMany({
      where: {
        patientId: params.patientId,
        status: 'ACTIVE',
      },
      data: { status: 'RELEASED' },
    });

    // 5. Create new 10-minute hold
    const expiresAt = new Date(Date.now() + ENV.SLOT_HOLD_DURATION_MINUTES * 60 * 1000);
    const hold = await prisma.slotHold.create({
      data: {
        doctorId: params.doctorId,
        patientId: params.patientId,
        date: params.date,
        startTime: params.startTime,
        endTime: params.endTime,
        expiresAt,
        status: 'ACTIVE',
      },
      include: {
        doctor: {
          include: { user: true },
        },
      },
    });

    return {
      holdId: hold.id,
      doctorId: hold.doctorId,
      doctorName: hold.doctor.user.name,
      specialisation: hold.doctor.specialisation,
      date: hold.date,
      startTime: hold.startTime,
      endTime: hold.endTime,
      expiresAt: hold.expiresAt,
      holdMinutes: ENV.SLOT_HOLD_DURATION_MINUTES,
    };
  }

  /**
   * Releases an active hold
   */
  public async releaseHold(holdId: string, patientId: string) {
    const hold = await prisma.slotHold.findFirst({
      where: { id: holdId, patientId },
    });
    if (!hold) return false;

    await prisma.slotHold.update({
      where: { id: holdId },
      data: { status: 'RELEASED' },
    });
    return true;
  }

  /**
   * Confirms a held slot atomically, analyzes symptoms with LLM, and syncs notifications
   */
  public async confirmBooking(params: {
    holdId: string;
    patientId: string;
    symptoms: string;
  }) {
    const now = new Date();

    // 1. Verify hold validity
    const hold = await prisma.slotHold.findUnique({
      where: { id: params.holdId },
      include: {
        doctor: { include: { user: true } },
        patient: true,
      },
    });

    if (!hold) {
      throw new Error('Slot hold session not found.');
    }

    if (hold.patientId !== params.patientId) {
      throw new Error('Unauthorized slot hold access.');
    }

    if (hold.status !== 'ACTIVE' || hold.expiresAt <= now) {
      throw new Error('Your 10-minute slot reservation has expired. Please select the slot again.');
    }

    // 2. Perform AI Pre-Visit Triage Analysis
    const aiAnalysis = await aiService.analyzePreVisitSymptoms(params.symptoms);

    // 3. Create Calendar Event
    const { eventId: gcalEventId, meetLink } = await calendarService.createEvent({
      userId: hold.patientId,
      patientName: hold.patient.name,
      patientEmail: hold.patient.email,
      doctorName: hold.doctor.user.name,
      doctorEmail: hold.doctor.user.email,
      specialisation: hold.doctor.specialisation,
      date: hold.date,
      startTime: hold.startTime,
      endTime: hold.endTime,
      symptoms: params.symptoms,
    });

    // 4. Atomic Transaction: Confirm slot, create Appointment, mark hold CONFIRMED
    const appointment = await prisma.$transaction(async (tx) => {
      // Double check inside transaction that slot was not booked in parallel
      const conflictingAppointment = await tx.appointment.findFirst({
        where: {
          doctorId: hold.doctorId,
          date: hold.date,
          startTime: hold.startTime,
          status: 'CONFIRMED',
        },
      });

      if (conflictingAppointment) {
        throw new Error('Double-booking collision detected. This slot was just confirmed.');
      }

      const created = await tx.appointment.create({
        data: {
          patientId: hold.patientId,
          doctorId: hold.doctorId,
          date: hold.date,
          startTime: hold.startTime,
          endTime: hold.endTime,
          status: 'CONFIRMED',
          symptoms: params.symptoms,
          urgencyLevel: aiAnalysis.urgencyLevel,
          chiefComplaint: aiAnalysis.chiefComplaint,
          suggestedQuestions: JSON.stringify(aiAnalysis.suggestedQuestions),
          aiTriageSummary: aiAnalysis.summary,
          googleCalendarEventId: gcalEventId,
          meetLink,
        },
        include: {
          patient: true,
          doctor: { include: { user: true } },
        },
      });

      await tx.slotHold.update({
        where: { id: hold.id },
        data: { status: 'CONFIRMED' },
      });

      return created;
    });

    // 5. Send booking confirmation emails
    emailService.sendBookingConfirmation({
      patientEmail: hold.patient.email,
      patientName: hold.patient.name,
      doctorName: hold.doctor.user.name,
      doctorEmail: hold.doctor.user.email,
      specialisation: hold.doctor.specialisation,
      date: appointment.date,
      startTime: appointment.startTime,
      endTime: appointment.endTime,
      symptoms: appointment.symptoms,
      urgencyLevel: appointment.urgencyLevel,
      meetLink: appointment.meetLink,
    }).catch((err) => logger.error('Async booking email error:', err));

    return appointment;
  }

  /**
   * Reschedules an appointment to a new slot
   */
  public async rescheduleAppointment(params: {
    appointmentId: string;
    patientId: string;
    newDate: string;
    newStartTime: string;
    newEndTime: string;
  }) {
    const appt = await prisma.appointment.findUnique({
      where: { id: params.appointmentId },
      include: {
        doctor: { include: { user: true } },
        patient: true,
      },
    });

    if (!appt) throw new Error('Appointment not found');
    if (appt.patientId !== params.patientId) throw new Error('Unauthorized');
    if (appt.status !== 'CONFIRMED') throw new Error('Only confirmed appointments can be rescheduled');

    // Check doctor leave
    const leaves = await prisma.doctorLeave.findMany({
      where: { doctorId: appt.doctorId, status: 'APPROVED' },
    });
    if (leaves.some((l) => isDateInRange(params.newDate, l.startDate, l.endDate))) {
      throw new Error('Doctor is on leave on the selected date.');
    }

    // Check conflict
    const conflict = await prisma.appointment.findFirst({
      where: {
        doctorId: appt.doctorId,
        date: params.newDate,
        startTime: params.newStartTime,
        status: 'CONFIRMED',
        id: { not: appt.id },
      },
    });
    if (conflict) throw new Error('Target slot is already booked.');

    // Update appointment
    const updated = await prisma.appointment.update({
      where: { id: appt.id },
      data: {
        date: params.newDate,
        startTime: params.newStartTime,
        endTime: params.newEndTime,
        reminderSent24h: false,
        reminderSent2h: false,
      },
      include: {
        doctor: { include: { user: true } },
        patient: true,
      },
    });

    // Update Google Calendar
    calendarService.updateEvent({
      userId: appt.patientId,
      eventId: appt.googleCalendarEventId,
      date: params.newDate,
      startTime: params.newStartTime,
      endTime: params.newEndTime,
    }).catch(() => {});

    // Notify patient
    emailService.sendBookingConfirmation({
      patientEmail: appt.patient.email,
      patientName: appt.patient.name,
      doctorName: appt.doctor.user.name,
      doctorEmail: appt.doctor.user.email,
      specialisation: appt.doctor.specialisation,
      date: updated.date,
      startTime: updated.startTime,
      endTime: updated.endTime,
      symptoms: updated.symptoms,
      urgencyLevel: updated.urgencyLevel,
      meetLink: updated.meetLink,
    }).catch(() => {});

    return updated;
  }

  /**
   * Cancels an appointment
   */
  public async cancelAppointment(params: {
    appointmentId: string;
    userId: string;
    role: string;
    reason?: string;
  }) {
    const appt = await prisma.appointment.findUnique({
      where: { id: params.appointmentId },
      include: {
        doctor: { include: { user: true } },
        patient: true,
      },
    });

    if (!appt) throw new Error('Appointment not found');

    if (params.role === 'PATIENT' && appt.patientId !== params.userId) {
      throw new Error('Unauthorized');
    }

    const updated = await prisma.appointment.update({
      where: { id: appt.id },
      data: {
        status: 'CANCELLED_BY_PATIENT',
        cancellationReason: params.reason || 'Cancelled by user',
      },
      include: {
        doctor: { include: { user: true } },
        patient: true,
      },
    });

    // Delete Google Calendar event
    calendarService.deleteEvent({
      userId: appt.patientId,
      eventId: appt.googleCalendarEventId,
    }).catch(() => {});

    // Send Cancellation Email
    emailService.sendCancellationNotice({
      patientEmail: appt.patient.email,
      patientName: appt.patient.name,
      doctorName: appt.doctor.user.name,
      date: appt.date,
      startTime: appt.startTime,
      reason: params.reason,
    }).catch(() => {});

    return updated;
  }

  /**
   * Doctor completes consultation, enters clinical notes, generates AI summary and prescriptions
   */
  public async submitConsultation(params: {
    appointmentId: string;
    doctorId: string;
    clinicalNotes: string;
    prescriptions?: Array<{
      medicationName: string;
      dosage: string;
      frequency: string;
      durationDays: number;
      instructions?: string;
    }>;
  }) {
    const appt = await prisma.appointment.findUnique({
      where: { id: params.appointmentId },
      include: {
        doctor: { include: { user: true } },
        patient: true,
      },
    });

    if (!appt) throw new Error('Appointment not found');
    if (appt.doctorId !== params.doctorId) throw new Error('Unauthorized consultation modification');

    // 1. Generate AI Post-Visit Summary & Care Plan
    const aiCarePlan = await aiService.generatePostVisitSummary(params.clinicalNotes);

    // 2. Update appointment to COMPLETED
    const updated = await prisma.appointment.update({
      where: { id: appt.id },
      data: {
        status: 'COMPLETED',
        clinicalNotes: params.clinicalNotes,
        postVisitSummary: aiCarePlan.friendlySummary,
        followUpSteps: JSON.stringify(aiCarePlan.followUpSteps),
      },
    });

    // 3. Create Prescriptions & Medication Reminders
    if (params.prescriptions && params.prescriptions.length > 0) {
      for (const rx of params.prescriptions) {
        const durationDays = rx.durationDays || 5;
        const startDate = new Date();
        const endDate = new Date(Date.now() + durationDays * 24 * 60 * 60 * 1000);

        const createdRx = await prisma.prescription.create({
          data: {
            appointmentId: appt.id,
            medicationName: rx.medicationName,
            dosage: rx.dosage,
            frequency: rx.frequency,
            durationDays,
            instructions: rx.instructions || null,
            startDate,
            endDate,
          },
        });

        // Generate medication reminder entries for each day
        const reminderTimes = this.calculateReminderTimes(rx.frequency);
        for (let d = 0; d < durationDays; d++) {
          const currentDay = new Date(Date.now() + d * 24 * 60 * 60 * 1000);
          const yyyyMmDd = currentDay.toISOString().split('T')[0];

          for (const timeStr of reminderTimes) {
            await prisma.medicationReminder.create({
              data: {
                prescriptionId: createdRx.id,
                patientId: appt.patientId,
                scheduledDate: yyyyMmDd,
                scheduledTime: timeStr,
                status: 'PENDING',
              },
            });
          }
        }
      }
    }

    return {
      appointment: updated,
      postVisitSummary: aiCarePlan.friendlySummary,
      medicationSchedule: aiCarePlan.medicationSchedule,
      followUpSteps: aiCarePlan.followUpSteps,
      warningsToWatch: aiCarePlan.warningsToWatch,
    };
  }

  private calculateReminderTimes(frequency: string): string[] {
    const lower = frequency.toLowerCase();
    if (lower.includes('three') || lower.includes('3 times') || lower.includes('tds')) {
      return ['08:00', '14:00', '20:00'];
    }
    if (lower.includes('twice') || lower.includes('bd') || lower.includes('2 times')) {
      return ['08:00', '20:00'];
    }
    if (lower.includes('night') || lower.includes('bedtime') || lower.includes('hs')) {
      return ['21:00'];
    }
    return ['09:00']; // Once daily default
  }
}

export const bookingService = new BookingService();
