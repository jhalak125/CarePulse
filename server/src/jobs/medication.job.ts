import { prisma } from '../prisma.js';
import { emailService } from '../services/email.service.js';
import { logger } from '../utils/logger.js';

export async function processMedicationReminders() {
  try {
    const now = new Date();
    const today = now.toISOString().split('T')[0];
    const currentHour = String(now.getHours()).padStart(2, '0');
    const currentMin = String(now.getMinutes()).padStart(2, '0');
    const currentTime = `${currentHour}:${currentMin}`;

    const pendingReminders = await prisma.medicationReminder.findMany({
      where: {
        scheduledDate: today,
        scheduledTime: { lte: currentTime },
        status: 'PENDING',
      },
      include: {
        prescription: true,
        patient: true,
      },
      take: 20,
    });

    if (pendingReminders.length > 0) {
      logger.job('MedicationAlerts', `Found ${pendingReminders.length} due medication reminders to dispatch.`);

      for (const item of pendingReminders) {
        try {
          await emailService.sendMedicationReminder({
            patientEmail: item.patient.email,
            patientName: item.patient.name,
            medicationName: item.prescription.medicationName,
            dosage: item.prescription.dosage,
            frequency: item.prescription.frequency,
            instructions: item.prescription.instructions,
            scheduledTime: item.scheduledTime,
          });

          await prisma.medicationReminder.update({
            where: { id: item.id },
            data: {
              status: 'SENT',
              sentAt: new Date(),
            },
          });
        } catch (dispatchErr: any) {
          logger.error(`Failed to dispatch med reminder ${item.id}:`, dispatchErr.message);
        }
      }
    }
  } catch (err: any) {
    logger.error('Error during medication reminders job:', err.message);
  }
}
