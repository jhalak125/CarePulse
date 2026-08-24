import nodemailer from 'nodemailer';
import { ENV } from '../config/env.js';
import { logger } from '../utils/logger.js';
import { prisma } from '../prisma.js';

export class EmailService {
  private transporter: nodemailer.Transporter | null = null;
  private isEthereal = false;

  constructor() {
    this.initTransporter();
  }

  private async initTransporter() {
    try {
      if (ENV.SMTP.HOST && ENV.SMTP.USER) {
        this.transporter = nodemailer.createTransport({
          host: ENV.SMTP.HOST,
          port: ENV.SMTP.PORT,
          secure: ENV.SMTP.PORT === 465,
          auth: {
            user: ENV.SMTP.USER,
            pass: ENV.SMTP.PASS,
          },
        });
        logger.success(`Configured custom SMTP email transporter (${ENV.SMTP.HOST})`);
      } else {
        // Create an Ethereal test account for sandbox & preview URLs
        const testAccount = await nodemailer.createTestAccount();
        this.transporter = nodemailer.createTransport({
          host: 'smtp.ethereal.email',
          port: 587,
          secure: false,
          auth: {
            user: testAccount.user,
            pass: testAccount.pass,
          },
        });
        this.isEthereal = true;
        logger.info(`Initialized Ethereal Test Email Transporter (User: ${testAccount.user}). All emails will have live preview URLs.`);
      }
    } catch (err: any) {
      logger.error('Failed to initialize Email Transporter:', err.message);
    }
  }

  /**
   * Enqueues and dispatches an email, recording to EmailQueue
   */
  public async sendMail(options: {
    recipient: string;
    recipientName?: string;
    subject: string;
    templateType: string;
    html: string;
  }): Promise<{ success: boolean; previewUrl?: string; error?: string }> {
    // Record to database queue first
    const queuedItem = await prisma.emailQueue.create({
      data: {
        recipient: options.recipient,
        recipientName: options.recipientName || null,
        subject: options.subject,
        templateType: options.templateType,
        contentHtml: options.html,
        status: 'PENDING',
        attempts: 0,
      },
    });

    return this.dispatchQueueItem(queuedItem.id);
  }

  /**
   * Dispatches a specific queued email item
   */
  public async dispatchQueueItem(queueId: string): Promise<{ success: boolean; previewUrl?: string; error?: string }> {
    const item = await prisma.emailQueue.findUnique({ where: { id: queueId } });
    if (!item) return { success: false, error: 'Queue item not found' };

    try {
      if (!this.transporter) {
        await this.initTransporter();
      }

      if (!this.transporter) {
        throw new Error('Email transporter unavailable');
      }

      const mailOptions = {
        from: ENV.SMTP.FROM,
        to: item.recipient,
        subject: item.subject,
        html: item.contentHtml,
      };

      const info = await this.transporter.sendMail(mailOptions);
      let previewUrl = undefined;

      if (this.isEthereal || info.messageId) {
        const etherealUrl = nodemailer.getTestMessageUrl(info);
        if (etherealUrl) {
          previewUrl = etherealUrl.toString();
          logger.info(`📧 [Email Sent] Preview link: ${previewUrl}`);
        }
      }

      await prisma.emailQueue.update({
        where: { id: item.id },
        data: {
          status: 'SENT',
          attempts: item.attempts + 1,
          previewUrl: previewUrl || null,
          lastError: null,
        },
      });

      return { success: true, previewUrl };
    } catch (err: any) {
      logger.error(`Failed sending email to ${item.recipient}:`, err.message);

      const nextAttempt = new Date(Date.now() + Math.pow(2, item.attempts + 1) * 60 * 1000);

      await prisma.emailQueue.update({
        where: { id: item.id },
        data: {
          status: item.attempts >= 4 ? 'FAILED' : 'PENDING',
          attempts: item.attempts + 1,
          lastError: err.message,
          nextAttemptAt: nextAttempt,
        },
      });

      return { success: false, error: err.message };
    }
  }

  // --- Rich Email Template Generators ---

  public async sendBookingConfirmation(payload: {
    patientEmail: string;
    patientName: string;
    doctorName: string;
    doctorEmail?: string;
    specialisation: string;
    date: string;
    startTime: string;
    endTime: string;
    symptoms: string;
    urgencyLevel: string;
    meetLink?: string | null;
  }) {
    const html = `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f8fafc; margin: 0; padding: 20px; color: #1e293b; }
    .container { max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 12px; overflow: hidden; border: 1px solid #e2e8f0; box-shadow: 0 4px 12px rgba(0,0,0,0.05); }
    .header { background: linear-gradient(135deg, #059669, #0d9488); color: white; padding: 30px 24px; text-align: center; }
    .header h1 { margin: 0; font-size: 24px; font-weight: 700; }
    .content { padding: 24px; }
    .card { background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 8px; padding: 16px; margin: 16px 0; }
    .badge { display: inline-block; padding: 4px 12px; border-radius: 9999px; font-weight: 600; font-size: 12px; text-transform: uppercase; }
    .badge-HIGH { background: #fee2e2; color: #b91c1c; }
    .badge-MEDIUM { background: #fef3c7; color: #b45309; }
    .badge-LOW { background: #dcfce7; color: #15803d; }
    .details-row { display: flex; justify-content: space-between; margin-bottom: 8px; font-size: 14px; }
    .btn { display: inline-block; background: #059669; color: white !important; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 600; margin-top: 16px; }
    .footer { padding: 16px 24px; background: #f8fafc; font-size: 12px; color: #64748b; text-align: center; border-top: 1px solid #e2e8f0; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🩺 Appointment Confirmed</h1>
      <p style="margin: 6px 0 0 0; opacity: 0.9;">CarePulse Healthcare Platform</p>
    </div>
    <div class="content">
      <p>Hello <strong>${payload.patientName}</strong>,</p>
      <p>Your healthcare appointment has been successfully scheduled and confirmed with <strong>Dr. ${payload.doctorName}</strong>.</p>
      
      <div class="card">
        <h3 style="margin-top: 0; color: #047857;">Appointment Details</h3>
        <p><strong>Doctor:</strong> Dr. ${payload.doctorName} (${payload.specialisation})</p>
        <p><strong>Date:</strong> ${payload.date}</p>
        <p><strong>Time Slot:</strong> ${payload.startTime} - ${payload.endTime}</p>
        <p><strong>Urgency Level:</strong> <span class="badge badge-${payload.urgencyLevel}">${payload.urgencyLevel}</span></p>
        ${payload.meetLink ? `<p><strong>Virtual Consultation:</strong> <a href="${payload.meetLink}" target="_blank">${payload.meetLink}</a></p>` : ''}
      </div>

      <div style="background: #f8fafc; border-radius: 8px; padding: 14px; margin-top: 16px; font-size: 14px;">
        <strong style="color: #475569;">Recorded Symptoms:</strong>
        <p style="margin: 4px 0 0 0; color: #334155; font-style: italic;">"${payload.symptoms}"</p>
      </div>

      <p style="margin-top: 20px; font-size: 14px; color: #475569;">
        We have added this event to Google Calendar. You will receive reminder alerts prior to your visit.
      </p>
    </div>
    <div class="footer">
      CarePulse Healthcare Systems &copy; 2026. Automated clinical notification.
    </div>
  </div>
</body>
</html>
    `;

    // Send to patient
    await this.sendMail({
      recipient: payload.patientEmail,
      recipientName: payload.patientName,
      subject: `Confirmed: Appointment with Dr. ${payload.doctorName} on ${payload.date} at ${payload.startTime}`,
      templateType: 'BOOKING_CONFIRMATION_PATIENT',
      html,
    });

    // Also send confirmation notification to doctor if email is provided
    if (payload.doctorEmail) {
      const doctorHtml = `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: 'Segoe UI', sans-serif; background-color: #f8fafc; margin: 0; padding: 20px; color: #1e293b; }
    .container { max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 12px; overflow: hidden; border: 1px solid #e2e8f0; }
    .header { background: #0f172a; color: white; padding: 24px; text-align: center; }
    .content { padding: 24px; }
    .card { background: #f1f5f9; border-radius: 8px; padding: 16px; margin: 16px 0; }
    .badge { display: inline-block; padding: 4px 10px; border-radius: 9999px; font-weight: 600; font-size: 12px; }
    .badge-HIGH { background: #fee2e2; color: #b91c1c; }
    .badge-MEDIUM { background: #fef3c7; color: #b45309; }
    .badge-LOW { background: #dcfce7; color: #15803d; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h2 style="margin:0;">📋 New Patient Booking: ${payload.patientName}</h2>
    </div>
    <div class="content">
      <p>Dr. <strong>${payload.doctorName}</strong>, a new consultation has been booked on your calendar.</p>
      <div class="card">
        <p><strong>Patient:</strong> ${payload.patientName} (${payload.patientEmail})</p>
        <p><strong>Slot:</strong> ${payload.date} at ${payload.startTime} - ${payload.endTime}</p>
        <p><strong>AI Triage Urgency:</strong> <span class="badge badge-${payload.urgencyLevel}">${payload.urgencyLevel}</span></p>
        <p><strong>Symptoms:</strong> "${payload.symptoms}"</p>
      </div>
      <p>Log in to your Doctor Portal to view the full AI Pre-Visit Briefing and suggested clinical questions.</p>
    </div>
  </div>
</body>
</html>
      `;

      await this.sendMail({
        recipient: payload.doctorEmail,
        recipientName: `Dr. ${payload.doctorName}`,
        subject: `New Patient Appointment: ${payload.patientName} on ${payload.date} (${payload.startTime})`,
        templateType: 'BOOKING_CONFIRMATION_DOCTOR',
        html: doctorHtml,
      });
    }
  }

  public async sendDoctorLeaveCancellation(payload: {
    patientEmail: string;
    patientName: string;
    doctorName: string;
    date: string;
    startTime: string;
    reason: string;
  }) {
    const html = `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f8fafc; margin: 0; padding: 20px; }
    .container { max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 12px; overflow: hidden; border: 1px solid #fee2e2; }
    .header { background: #dc2626; color: white; padding: 24px; text-align: center; }
    .content { padding: 24px; color: #1e293b; font-size: 15px; }
    .alert-box { background: #fef2f2; border: 1px solid #fca5a5; border-radius: 8px; padding: 16px; margin: 16px 0; color: #991b1b; }
    .btn { display: inline-block; background: #059669; color: white !important; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 600; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h2 style="margin: 0;">⚠️ Doctor Leave Notice - Reschedule Required</h2>
    </div>
    <div class="content">
      <p>Dear <strong>${payload.patientName}</strong>,</p>
      <div class="alert-box">
        Dr. <strong>${payload.doctorName}</strong> is unexpectedly on approved leave on <strong>${payload.date}</strong> (${payload.reason || 'Medical / Personal leave'}).
      </div>
      <p>Consequently, your appointment scheduled for <strong>${payload.date} at ${payload.startTime}</strong> has been cancelled.</p>
      <p>Please log in to your patient portal to choose another slot or select another specialist at your earliest convenience.</p>
      <div style="text-align: center; margin: 24px 0;">
        <a href="${ENV.CLIENT_URL}" class="btn">Reschedule Your Appointment Now</a>
      </div>
      <p style="font-size: 13px; color: #64748b;">We sincerely apologize for the inconvenience caused to your healthcare schedule.</p>
    </div>
  </div>
</body>
</html>
    `;

    return this.sendMail({
      recipient: payload.patientEmail,
      recipientName: payload.patientName,
      subject: `Important: Reschedule Required - Dr. ${payload.doctorName} on leave (${payload.date})`,
      templateType: 'DOCTOR_LEAVE_ALERT',
      html,
    });
  }

  public async sendMedicationReminder(payload: {
    patientEmail: string;
    patientName: string;
    medicationName: string;
    dosage: string;
    frequency: string;
    instructions?: string | null;
    scheduledTime: string;
  }) {
    const html = `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: 'Segoe UI', sans-serif; background-color: #f8fafc; margin: 0; padding: 20px; }
    .container { max-width: 550px; margin: 0 auto; background: #ffffff; border-radius: 12px; overflow: hidden; border: 1px solid #e2e8f0; }
    .header { background: #2563eb; color: white; padding: 20px; text-align: center; }
    .content { padding: 20px; color: #1e293b; }
    .med-box { background: #eff6ff; border: 1px solid #bfdbfe; border-radius: 8px; padding: 16px; margin: 16px 0; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h2 style="margin:0;">💊 Medication Reminder</h2>
    </div>
    <div class="content">
      <p>Hi <strong>${payload.patientName}</strong>, it's time for your scheduled medication:</p>
      <div class="med-box">
        <h3 style="margin-top:0; color:#1d4ed8;">${payload.medicationName} (${payload.dosage})</h3>
        <p><strong>Scheduled Time:</strong> ${payload.scheduledTime}</p>
        <p><strong>Frequency:</strong> ${payload.frequency}</p>
        ${payload.instructions ? `<p><strong>Instructions:</strong> ${payload.instructions}</p>` : ''}
      </div>
      <p style="font-size: 13px; color: #64748b;">Please log in to your CarePulse dashboard to mark this dosage as taken.</p>
    </div>
  </div>
</body>
</html>
    `;

    return this.sendMail({
      recipient: payload.patientEmail,
      recipientName: payload.patientName,
      subject: `Medication Alert: Time to take ${payload.medicationName} (${payload.dosage})`,
      templateType: 'MEDICATION_REMINDER',
      html,
    });
  }

  public async sendAppointmentReminder(payload: {
    patientEmail: string;
    patientName: string;
    doctorName: string;
    date: string;
    startTime: string;
    meetLink?: string | null;
    timeframe: '24 hours' | '2 hours';
  }) {
    const html = `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: 'Segoe UI', sans-serif; background-color: #f8fafc; margin: 0; padding: 20px; }
    .container { max-width: 550px; margin: 0 auto; background: #ffffff; border-radius: 12px; overflow: hidden; border: 1px solid #e2e8f0; }
    .header { background: #0891b2; color: white; padding: 20px; text-align: center; }
    .content { padding: 20px; color: #1e293b; }
    .card { background: #ecfeff; border: 1px solid #a5f3fc; border-radius: 8px; padding: 16px; margin: 16px 0; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h2 style="margin:0;">⏰ Appointment Reminder (${payload.timeframe})</h2>
    </div>
    <div class="content">
      <p>Dear <strong>${payload.patientName}</strong>,</p>
      <p>This is a reminder that your appointment with <strong>Dr. ${payload.doctorName}</strong> is coming up in <strong>${payload.timeframe}</strong>.</p>
      <div class="card">
        <p><strong>Date:</strong> ${payload.date}</p>
        <p><strong>Time:</strong> ${payload.startTime}</p>
        ${payload.meetLink ? `<p><strong>Join Virtual Room:</strong> <a href="${payload.meetLink}">${payload.meetLink}</a></p>` : ''}
      </div>
      <p style="font-size: 13px; color: #64748b;">Please arrive or join 5 minutes early. If you need to reschedule, please do so from your dashboard.</p>
    </div>
  </div>
</body>
</html>
    `;

    return this.sendMail({
      recipient: payload.patientEmail,
      recipientName: payload.patientName,
      subject: `Reminder: Doctor appointment in ${payload.timeframe} on ${payload.date} at ${payload.startTime}`,
      templateType: 'APPOINTMENT_REMINDER',
      html,
    });
  }

  public async sendCancellationNotice(payload: {
    patientEmail: string;
    patientName: string;
    doctorName: string;
    date: string;
    startTime: string;
    reason?: string;
  }) {
    const html = `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: 'Segoe UI', sans-serif; background-color: #f8fafc; margin: 0; padding: 20px; }
    .container { max-width: 550px; margin: 0 auto; background: #ffffff; border-radius: 12px; overflow: hidden; border: 1px solid #e2e8f0; }
    .header { background: #64748b; color: white; padding: 20px; text-align: center; }
    .content { padding: 20px; color: #1e293b; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h2 style="margin:0;">Appointment Cancelled</h2>
    </div>
    <div class="content">
      <p>Dear <strong>${payload.patientName}</strong>,</p>
      <p>Your appointment with <strong>Dr. ${payload.doctorName}</strong> on <strong>${payload.date} at ${payload.startTime}</strong> has been cancelled.</p>
      ${payload.reason ? `<p><strong>Reason:</strong> ${payload.reason}</p>` : ''}
      <p>You may book a new consultation anytime through the CarePulse portal.</p>
    </div>
  </div>
</body>
</html>
    `;

    return this.sendMail({
      recipient: payload.patientEmail,
      recipientName: payload.patientName,
      subject: `Cancelled: Appointment with Dr. ${payload.doctorName} on ${payload.date}`,
      templateType: 'APPOINTMENT_CANCELLED',
      html,
    });
  }
}

export const emailService = new EmailService();
