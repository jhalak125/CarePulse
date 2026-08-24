import { prisma } from '../prisma.js';
import { logger } from '../utils/logger.js';

export async function cleanupExpiredSlotHolds() {
  try {
    const now = new Date();
    const result = await prisma.slotHold.updateMany({
      where: {
        status: 'ACTIVE',
        expiresAt: { lt: now },
      },
      data: {
        status: 'EXPIRED',
      },
    });

    if (result.count > 0) {
      logger.job('SlotCleanup', `Released ${result.count} expired slot holds back to available pool.`);
    }
  } catch (err: any) {
    logger.error('Error during expired slot hold cleanup:', err.message);
  }
}
