import { Request, Response } from 'express';
import { prisma } from '../prisma.js';
import { leaveService } from '../services/leave.service.js';

export class LeaveController {
  public async applyLeave(req: Request, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, message: 'Unauthorized' });
        return;
      }

      let { doctorId, startDate, endDate, reason } = req.body;

      if (!startDate || !endDate || !reason) {
        res.status(400).json({ success: false, message: 'startDate, endDate, and reason are required.' });
        return;
      }

      if (req.user.role === 'DOCTOR') {
        const doctor = await prisma.doctorProfile.findUnique({ where: { userId: req.user.id } });
        if (!doctor) {
          res.status(404).json({ success: false, message: 'Doctor profile not found' });
          return;
        }
        doctorId = doctor.id;
      }

      if (!doctorId) {
        res.status(400).json({ success: false, message: 'doctorId is required.' });
        return;
      }

      const result = await leaveService.applyDoctorLeave({
        doctorId,
        startDate,
        endDate,
        reason,
      });

      res.status(201).json({
        success: true,
        message: `Leave recorded successfully. ${result.affectedAppointmentsCount} conflicting appointment(s) resolved and patients notified.`,
        leave: result.leave,
        affectedAppointmentsCount: result.affectedAppointmentsCount,
        affectedAppointments: result.affectedAppointments,
      });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  }

  public async previewConflicts(req: Request, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, message: 'Unauthorized' });
        return;
      }

      let { doctorId, startDate, endDate } = req.body;

      if (req.user.role === 'DOCTOR') {
        const doctor = await prisma.doctorProfile.findUnique({ where: { userId: req.user.id } });
        if (!doctor) {
          res.status(404).json({ success: false, message: 'Doctor profile not found' });
          return;
        }
        doctorId = doctor.id;
      }

      if (!doctorId || !startDate || !endDate) {
        res.status(400).json({ success: false, message: 'doctorId, startDate, and endDate are required.' });
        return;
      }

      const preview = await leaveService.previewLeaveConflicts({
        doctorId,
        startDate,
        endDate,
      });

      res.json({ success: true, preview });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  }

  public async getLeaves(req: Request, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, message: 'Unauthorized' });
        return;
      }

      let doctorId = req.query.doctorId as string | undefined;

      if (req.user.role === 'DOCTOR') {
        const doctor = await prisma.doctorProfile.findUnique({ where: { userId: req.user.id } });
        if (!doctor) {
          res.status(404).json({ success: false, message: 'Doctor profile not found' });
          return;
        }
        doctorId = doctor.id;
      }

      const leaves = await prisma.doctorLeave.findMany({
        where: doctorId ? { doctorId } : {},
        include: {
          doctor: { include: { user: { select: { id: true, name: true, email: true } } } },
        },
        orderBy: { startDate: 'desc' },
      });

      res.json({ success: true, leaves });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  }

  public async deleteLeave(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      await prisma.doctorLeave.delete({ where: { id } });
      res.json({ success: true, message: 'Doctor leave removed.' });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  }
}

export const leaveController = new LeaveController();
