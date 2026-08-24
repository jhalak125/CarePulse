import cron from 'node-cron';
import { cleanupExpiredSlotHolds } from './slotCleanup.job.js';
import { processMedicationReminders } from './medication.job.js';
import { processEmailRetries } from './emailRetry.job.js';
import { processAppointmentReminders } from './reminder.job.js';
import { logger } from '../utils/logger.js';

export function startBackgroundJobs() {
  logger.info('Initializing automated background cron schedulers...');

  // 1. Expired Slot Hold Cleanup: runs every 1 minute
  cron.schedule('* * * * *', async () => {
    await cleanupExpiredSlotHolds();
  });

  // 2. Medication Reminder Dispatcher: runs every 2 minutes
  cron.schedule('*/2 * * * *', async () => {
    await processMedicationReminders();
  });

  // 3. Email Retry Queue Processor: runs every 2 minutes
  cron.schedule('*/2 * * * *', async () => {
    await processEmailRetries();
  });

  // 4. 24h & 2h Appointment Reminder Check: runs every 15 minutes
  cron.schedule('*/15 * * * *', async () => {
    await processAppointmentReminders();
  });

  logger.success('All 4 background workers (Slot Holds, Medication, Email Retries, Appointment Reminders) are actively scheduled.');
}
