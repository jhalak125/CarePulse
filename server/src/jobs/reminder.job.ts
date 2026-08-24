import { prisma } from '../prisma.js';
import { emailService } from '../services/email.service.js';
import { logger } from '../utils/logger.js';

export async function processAppointmentReminders() {
  try {
    const now = new Date();
    
    // Find all confirmed appointments in the upcoming 48 hours
    const upcomingAppointments = await prisma.appointment.findMany({
      where: {
        status: 'CONFIRMED',
        OR: [
          { reminderSent24h: false },
          { reminderSent2h: false },
        ],
      },
      include: {
        patient: true,
        doctor: { include: { user: true } },
      },
    });

    for (const appt of upcomingAppointments) {
      try {
        const appointmentTime = new Date(`${appt.date}T${appt.startTime}:00`);
        const diffMs = appointmentTime.getTime() - now.getTime();
        const diffHours = diffMs / (1000 * 60 * 60);

        // Check for 24-hour reminder window (between 23h and 25h)
        if (!appt.reminderSent24h && diffHours > 0 && diffHours <= 25 && diffHours >= 20) {
          await emailService.sendAppointmentReminder({
            patientEmail: appt.patient.email,
            patientName: appt.patient.name,
            doctorName: appt.doctor.user.name,
            date: appt.date,
            startTime: appt.startTime,
            meetLink: appt.meetLink,
            timeframe: '24 hours',
          });

          await prisma.appointment.update({
            where: { id: appt.id },
            data: { reminderSent24h: true },
          });

          logger.job('ReminderJob', `Sent 24h reminder to ${appt.patient.email} for appointment on ${appt.date}`);
        }

        // Check for 2-hour reminder window (between 0.5h and 2.5h)
        if (!appt.reminderSent2h && diffHours > 0 && diffHours <= 2.5) {
          await emailService.sendAppointmentReminder({
            patientEmail: appt.patient.email,
            patientName: appt.patient.name,
            doctorName: appt.doctor.user.name,
            date: appt.date,
            startTime: appt.startTime,
            meetLink: appt.meetLink,
            timeframe: '2 hours',
          });

          await prisma.appointment.update({
            where: { id: appt.id },
            data: { reminderSent2h: true },
          });

          logger.job('ReminderJob', `Sent 2h reminder to ${appt.patient.email} for appointment on ${appt.date}`);
        }
      } catch (err: any) {
        logger.error(`Error processing reminder for appointment ${appt.id}:`, err.message);
      }
    }
  } catch (err: any) {
    logger.error('Error during appointment reminder job:', err.message);
  }
}
