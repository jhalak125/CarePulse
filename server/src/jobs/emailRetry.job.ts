import { prisma } from '../prisma.js';
import { emailService } from '../services/email.service.js';
import { logger } from '../utils/logger.js';

export async function processEmailRetries() {
  try {
    const now = new Date();
    const pendingEmails = await prisma.emailQueue.findMany({
      where: {
        status: 'PENDING',
        OR: [
          { nextAttemptAt: null },
          { nextAttemptAt: { lte: now } },
        ],
        attempts: { lt: 5 },
      },
      take: 15,
    });

    if (pendingEmails.length > 0) {
      logger.job('EmailRetry', `Processing ${pendingEmails.length} pending/retrying emails from queue.`);

      for (const email of pendingEmails) {
        await emailService.dispatchQueueItem(email.id);
      }
    }
  } catch (err: any) {
    logger.error('Error during email retry job:', err.message);
  }
}
