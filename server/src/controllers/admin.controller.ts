import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { prisma } from '../prisma.js';
import { emailService } from '../services/email.service.js';

export class AdminController {
  public async getDashboardStats(req: Request, res: Response): Promise<void> {
    try {
      const today = new Date().toISOString().split('T')[0];

      const [
        totalAppointments,
        confirmedCount,
        completedCount,
        cancelledCount,
        todayCount,
        highUrgencyCount,
        medUrgencyCount,
        lowUrgencyCount,
        doctorCount,
        patientCount,
        activeHoldCount,
        emailQueueStats,
      ] = await Promise.all([
        prisma.appointment.count(),
        prisma.appointment.count({ where: { status: 'CONFIRMED' } }),
        prisma.appointment.count({ where: { status: 'COMPLETED' } }),
        prisma.appointment.count({ where: { status: { in: ['CANCELLED_BY_PATIENT', 'CANCELLED_DOCTOR_LEAVE'] } } }),
        prisma.appointment.count({ where: { date: today } }),
        prisma.appointment.count({ where: { urgencyLevel: 'HIGH' } }),
        prisma.appointment.count({ where: { urgencyLevel: 'MEDIUM' } }),
        prisma.appointment.count({ where: { urgencyLevel: 'LOW' } }),
        prisma.doctorProfile.count(),
        prisma.user.count({ where: { role: 'PATIENT' } }),
        prisma.slotHold.count({ where: { status: 'ACTIVE', expiresAt: { gt: new Date() } } }),
        prisma.emailQueue.groupBy({
          by: ['status'],
          _count: { id: true },
        }),
      ]);

      const emailStatusMap = { PENDING: 0, SENT: 0, FAILED: 0 };
      emailQueueStats.forEach((stat) => {
        if (stat.status in emailStatusMap) {
          (emailStatusMap as any)[stat.status] = stat._count.id;
        }
      });

      res.json({
        success: true,
        stats: {
          totalAppointments,
          confirmedCount,
          completedCount,
          cancelledCount,
          todayCount,
          activeHoldCount,
          doctorCount,
          patientCount,
          urgencyBreakdown: {
            HIGH: highUrgencyCount,
            MEDIUM: medUrgencyCount,
            LOW: lowUrgencyCount,
          },
          emailQueue: emailStatusMap,
        },
      });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  }

  public async getEmailLogs(req: Request, res: Response): Promise<void> {
    try {
      const { status } = req.query;
      const whereClause: any = {};
      if (status && typeof status === 'string' && status !== 'ALL') {
        whereClause.status = status;
      }

      const logs = await prisma.emailQueue.findMany({
        where: whereClause,
        orderBy: { createdAt: 'desc' },
        take: 50,
      });

      res.json({ success: true, logs });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  }

  public async retryEmail(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const result = await emailService.dispatchQueueItem(id);

      res.json({
        success: result.success,
        message: result.success ? 'Email dispatched successfully.' : `Retry failed: ${result.error}`,
        previewUrl: result.previewUrl,
      });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  }

  public async createDoctor(req: Request, res: Response): Promise<void> {
    try {
      const {
        name,
        email,
        password = 'Password123!',
        specialisation,
        experienceYears = 5,
        consultationFee = 75,
        slotDurationMinutes = 30,
        workingHoursStart = '09:00',
        workingHoursEnd = '17:00',
        breakStart = '13:00',
        breakEnd = '14:00',
        workingDays = 'Monday,Tuesday,Wednesday,Thursday,Friday',
        bio,
      } = req.body;

      if (!name || !email || !specialisation) {
        res.status(400).json({ success: false, message: 'Name, email, and specialisation are required.' });
        return;
      }

      const existing = await prisma.user.findUnique({ where: { email } });
      if (existing) {
        res.status(400).json({ success: false, message: 'A user with this email already exists.' });
        return;
      }

      const hashedPassword = await bcrypt.hash(password, 10);

      const user = await prisma.user.create({
        data: {
          name,
          email,
          password: hashedPassword,
          role: 'DOCTOR',
        },
      });

      const profile = await prisma.doctorProfile.create({
        data: {
          userId: user.id,
          specialisation,
          experienceYears: parseInt(String(experienceYears), 10),
          consultationFee: parseFloat(String(consultationFee)),
          slotDurationMinutes: parseInt(String(slotDurationMinutes), 10),
          workingHoursStart,
          workingHoursEnd,
          breakStart,
          breakEnd,
          workingDays,
          bio,
        },
        include: { user: true },
      });

      res.status(201).json({ success: true, message: 'Doctor profile created successfully.', doctor: profile });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  }
}

export const adminController = new AdminController();
