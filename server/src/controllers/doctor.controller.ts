import { Request, Response } from 'express';
import { prisma } from '../prisma.js';
import { generateDoctorSlots, getDayName, isDateInRange } from '../utils/dateUtils.js';

export class DoctorController {
  public async getDoctors(req: Request, res: Response): Promise<void> {
    try {
      const { specialisation, search } = req.query;

      const whereClause: any = {};

      if (specialisation && typeof specialisation === 'string' && specialisation !== 'All') {
        whereClause.specialisation = { contains: specialisation };
      }

      if (search && typeof search === 'string') {
        whereClause.OR = [
          { user: { name: { contains: search } } },
          { specialisation: { contains: search } },
          { bio: { contains: search } },
        ];
      }

      const doctors = await prisma.doctorProfile.findMany({
        where: whereClause,
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              phone: true,
              avatarUrl: true,
            },
          },
        },
        orderBy: { rating: 'desc' },
      });

      res.json({ success: true, doctors });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  }

  public async getDoctorById(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      const doctor = await prisma.doctorProfile.findUnique({
        where: { id },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              phone: true,
              avatarUrl: true,
            },
          },
          leaves: {
            where: { status: 'APPROVED' },
            select: { id: true, startDate: true, endDate: true, reason: true },
          },
        },
      });

      if (!doctor) {
        res.status(404).json({ success: false, message: 'Doctor not found' });
        return;
      }

      res.json({ success: true, doctor });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  }

  public async getDoctorAvailability(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { date } = req.query; // YYYY-MM-DD

      if (!date || typeof date !== 'string') {
        res.status(400).json({ success: false, message: 'Date parameter (YYYY-MM-DD) is required.' });
        return;
      }

      const doctor = await prisma.doctorProfile.findUnique({
        where: { id },
        include: { user: true },
      });

      if (!doctor) {
        res.status(404).json({ success: false, message: 'Doctor not found.' });
        return;
      }

      // Check working days
      const dayName = getDayName(date);
      const workingDays = doctor.workingDays.split(',').map((d) => d.trim().toLowerCase());
      const isWorkingDay = workingDays.includes(dayName.toLowerCase());

      if (!isWorkingDay) {
        res.json({
          success: true,
          date,
          dayName,
          isWorkingDay: false,
          isOnLeave: false,
          slots: [],
          message: `Dr. ${doctor.user.name} does not have clinic hours on ${dayName}s.`,
        });
        return;
      }

      // Check approved leaves
      const leaves = await prisma.doctorLeave.findMany({
        where: {
          doctorId: doctor.id,
          status: 'APPROVED',
        },
      });

      const activeLeave = leaves.find((l) => isDateInRange(date, l.startDate, l.endDate));
      if (activeLeave) {
        res.json({
          success: true,
          date,
          dayName,
          isWorkingDay: true,
          isOnLeave: true,
          leaveReason: activeLeave.reason,
          slots: [],
          message: `Dr. ${doctor.user.name} is on approved leave on ${date} (${activeLeave.reason}).`,
        });
        return;
      }

      // Generate all doctor slots for the day
      const rawSlots = generateDoctorSlots(
        doctor.workingHoursStart,
        doctor.workingHoursEnd,
        doctor.slotDurationMinutes,
        doctor.breakStart,
        doctor.breakEnd
      );

      // Fetch confirmed appointments for this doctor on this date
      const bookedAppointments = await prisma.appointment.findMany({
        where: {
          doctorId: doctor.id,
          date,
          status: 'CONFIRMED',
        },
        select: { startTime: true, endTime: true, id: true },
      });

      // Fetch active unexpired slot holds
      const now = new Date();
      const activeHolds = await prisma.slotHold.findMany({
        where: {
          doctorId: doctor.id,
          date,
          status: 'ACTIVE',
          expiresAt: { gt: now },
        },
        select: { startTime: true, endTime: true, patientId: true, expiresAt: true },
      });

      const currentUserId = req.user?.id;

      // Evaluate slot status
      const slots = rawSlots.map((slot) => {
        const isBooked = bookedAppointments.some((b) => b.startTime === slot.startTime);
        const hold = activeHolds.find((h) => h.startTime === slot.startTime);
        const isHeldByMe = Boolean(hold && currentUserId && hold.patientId === currentUserId);
        const isHeldByOther = Boolean(hold && (!currentUserId || hold.patientId !== currentUserId));

        let status: 'AVAILABLE' | 'HELD_BY_YOU' | 'HELD_BY_OTHER' | 'BOOKED' = 'AVAILABLE';
        if (isBooked) status = 'BOOKED';
        else if (isHeldByMe) status = 'HELD_BY_YOU';
        else if (isHeldByOther) status = 'HELD_BY_OTHER';

        return {
          startTime: slot.startTime,
          endTime: slot.endTime,
          status,
          isAvailable: status === 'AVAILABLE' || status === 'HELD_BY_YOU',
          expiresAt: hold ? hold.expiresAt : null,
        };
      });

      res.json({
        success: true,
        date,
        dayName,
        isWorkingDay: true,
        isOnLeave: false,
        slotDurationMinutes: doctor.slotDurationMinutes,
        slots,
      });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  }

  public async updateDoctorProfile(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const {
        specialisation,
        experienceYears,
        consultationFee,
        slotDurationMinutes,
        workingHoursStart,
        workingHoursEnd,
        breakStart,
        breakEnd,
        workingDays,
        bio,
      } = req.body;

      const updated = await prisma.doctorProfile.update({
        where: { id },
        data: {
          specialisation: specialisation || undefined,
          experienceYears: experienceYears !== undefined ? parseInt(experienceYears, 10) : undefined,
          consultationFee: consultationFee !== undefined ? parseFloat(consultationFee) : undefined,
          slotDurationMinutes: slotDurationMinutes !== undefined ? parseInt(slotDurationMinutes, 10) : undefined,
          workingHoursStart: workingHoursStart || undefined,
          workingHoursEnd: workingHoursEnd || undefined,
          breakStart: breakStart !== undefined ? breakStart : undefined,
          breakEnd: breakEnd !== undefined ? breakEnd : undefined,
          workingDays: workingDays || undefined,
          bio: bio || undefined,
        },
        include: { user: true },
      });

      res.json({ success: true, message: 'Doctor schedule and profile updated.', doctor: updated });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  }
}

export const doctorController = new DoctorController();
