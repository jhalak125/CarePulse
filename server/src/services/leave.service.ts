import { prisma } from '../prisma.js';
import { emailService } from './email.service.js';
import { calendarService } from './calendar.service.js';
import { logger } from '../utils/logger.js';

export class LeaveService {
  /**
   * Applies leave for a doctor and automatically resolves conflicting appointments
   */
  public async applyDoctorLeave(params: {
    doctorId: string;
    startDate: string; // YYYY-MM-DD
    endDate: string; // YYYY-MM-DD
    reason: string;
  }) {
    // 1. Find all active confirmed appointments in this date range
    const conflictingAppointments = await prisma.appointment.findMany({
      where: {
        doctorId: params.doctorId,
        date: {
          gte: params.startDate,
          lte: params.endDate,
        },
        status: 'CONFIRMED',
      },
      include: {
        patient: true,
        doctor: { include: { user: true } },
      },
    });

    const affectedCount = conflictingAppointments.length;

    // 2. Create the DoctorLeave record
    const leave = await prisma.doctorLeave.create({
      data: {
        doctorId: params.doctorId,
        startDate: params.startDate,
        endDate: params.endDate,
        reason: params.reason,
        status: 'APPROVED',
        affectedAppointmentsCount: affectedCount,
      },
      include: {
        doctor: { include: { user: true } },
      },
    });

    // 3. Atomically update conflicting appointments and notify patients
    if (affectedCount > 0) {
      logger.warn(`Doctor leave triggered conflict resolution for ${affectedCount} appointments (Dr. ${leave.doctor.user.name})`);

      for (const appt of conflictingAppointments) {
        // Update appointment status
        await prisma.appointment.update({
          where: { id: appt.id },
          data: {
            status: 'CANCELLED_DOCTOR_LEAVE',
            cancellationReason: `Doctor on approved leave: ${params.reason}`,
          },
        });

        // Release/Delete Google Calendar event
        calendarService.deleteEvent({
          userId: appt.patientId,
          eventId: appt.googleCalendarEventId,
        }).catch(() => {});

        // Dispatch High-Priority Email to Patient
        emailService.sendDoctorLeaveCancellation({
          patientEmail: appt.patient.email,
          patientName: appt.patient.name,
          doctorName: appt.doctor.user.name,
          date: appt.date,
          startTime: appt.startTime,
          reason: params.reason,
        }).catch((err) => logger.error(`Failed to send leave cancellation email to ${appt.patient.email}:`, err));
      }
    }

    // 4. Also release any active slot holds in that range
    await prisma.slotHold.updateMany({
      where: {
        doctorId: params.doctorId,
        date: {
          gte: params.startDate,
          lte: params.endDate,
        },
        status: 'ACTIVE',
      },
      data: { status: 'RELEASED' },
    });

    return {
      leave,
      affectedAppointmentsCount: affectedCount,
      affectedAppointments: conflictingAppointments.map((a) => ({
        id: a.id,
        patientName: a.patient.name,
        patientEmail: a.patient.email,
        date: a.date,
        startTime: a.startTime,
      })),
    };
  }

  /**
   * Previews conflicts for a proposed leave before submission
   */
  public async previewLeaveConflicts(params: {
    doctorId: string;
    startDate: string;
    endDate: string;
  }) {
    const conflictingAppointments = await prisma.appointment.findMany({
      where: {
        doctorId: params.doctorId,
        date: {
          gte: params.startDate,
          lte: params.endDate,
        },
        status: 'CONFIRMED',
      },
      include: {
        patient: { select: { id: true, name: true, email: true } },
      },
      orderBy: [{ date: 'asc' }, { startTime: 'asc' }],
    });

    return {
      conflictCount: conflictingAppointments.length,
      conflicts: conflictingAppointments,
    };
  }

  /**
   * Retrieves leave history for a doctor
   */
  public async getDoctorLeaves(doctorId: string) {
    return prisma.doctorLeave.findMany({
      where: { doctorId },
      orderBy: { startDate: 'desc' },
    });
  }

  /**
   * Cancels/deletes a leave
   */
  public async deleteLeave(leaveId: string, doctorId?: string) {
    const whereClause: any = { id: leaveId };
    if (doctorId) whereClause.doctorId = doctorId;

    return prisma.doctorLeave.delete({
      where: whereClause,
    });
  }
}

export const leaveService = new LeaveService();
