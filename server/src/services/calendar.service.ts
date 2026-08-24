import { google } from 'googleapis';
import { ENV } from '../config/env.js';
import { logger } from '../utils/logger.js';
import { prisma } from '../prisma.js';

export class CalendarService {
  private oauth2Client: any = null;

  constructor() {
    if (ENV.GOOGLE_CLIENT_ID && ENV.GOOGLE_CLIENT_SECRET) {
      try {
        this.oauth2Client = new google.auth.OAuth2(
          ENV.GOOGLE_CLIENT_ID,
          ENV.GOOGLE_CLIENT_SECRET,
          ENV.GOOGLE_REDIRECT_URI
        );
        logger.success('Configured Google OAuth2 Calendar Client');
      } catch (err: any) {
        logger.warn('Failed to configure Google OAuth2 Client:', err.message);
      }
    } else {
      logger.info('Google Calendar OAuth credentials not provided. Mock calendar events & virtual links will be generated.');
    }
  }

  /**
   * Generates OAuth Consent URL for a user
   */
  public getAuthUrl(userId: string): string {
    if (!this.oauth2Client) {
      return `${ENV.CLIENT_URL}/?google_oauth=mock_connected`;
    }

    const scopes = [
      'https://www.googleapis.com/auth/calendar.events',
      'https://www.googleapis.com/auth/userinfo.email',
    ];

    return this.oauth2Client.generateAuthUrl({
      access_type: 'offline',
      prompt: 'consent',
      scope: scopes,
      state: userId,
    });
  }

  /**
   * Exchanges authorization code for tokens and saves to DB
   */
  public async handleOAuthCallback(code: string, userId: string): Promise<boolean> {
    if (!this.oauth2Client) return true;

    try {
      const { tokens } = await this.oauth2Client.getToken(code);
      
      await prisma.googleOAuthToken.upsert({
        where: { userId },
        create: {
          userId,
          accessToken: tokens.access_token || '',
          refreshToken: tokens.refresh_token || null,
          expiryDate: tokens.expiry_date ? BigInt(tokens.expiry_date) : null,
          scope: tokens.scope || null,
        },
        update: {
          accessToken: tokens.access_token || '',
          refreshToken: tokens.refresh_token || undefined,
          expiryDate: tokens.expiry_date ? BigInt(tokens.expiry_date) : undefined,
          scope: tokens.scope || undefined,
        },
      });

      logger.success(`Saved Google OAuth tokens for user ${userId}`);
      return true;
    } catch (err: any) {
      logger.error('Error exchanging Google OAuth code:', err.message);
      return false;
    }
  }

  /**
   * Creates a Google Calendar event for an appointment
   */
  public async createEvent(params: {
    userId: string;
    patientName: string;
    patientEmail: string;
    doctorName: string;
    doctorEmail?: string;
    specialisation: string;
    date: string; // YYYY-MM-DD
    startTime: string; // HH:mm
    endTime: string; // HH:mm
    symptoms: string;
  }): Promise<{ eventId: string; meetLink: string }> {
    const virtualMeetLink = `https://meet.google.com/care-${Math.random().toString(36).substring(2, 6)}-${Math.random().toString(36).substring(2, 6)}`;
    const mockEventId = `gcal-evt-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;

    try {
      // Check if user has connected Google Calendar
      const userToken = await prisma.googleOAuthToken.findUnique({
        where: { userId: params.userId },
      });

      if (this.oauth2Client && userToken) {
        this.oauth2Client.setCredentials({
          access_token: userToken.accessToken,
          refresh_token: userToken.refreshToken || undefined,
        });

        const calendar = google.calendar({ version: 'v3', auth: this.oauth2Client });

        const startDateTime = new Date(`${params.date}T${params.startTime}:00`).toISOString();
        const endDateTime = new Date(`${params.date}T${params.endTime}:00`).toISOString();

        const attendees = [{ email: params.patientEmail, displayName: params.patientName }];
        if (params.doctorEmail) {
          attendees.push({ email: params.doctorEmail, displayName: `Dr. ${params.doctorName}` });
        }

        const res = await calendar.events.insert({
          calendarId: 'primary',
          conferenceDataVersion: 1,
          requestBody: {
            summary: `Medical Consultation: Dr. ${params.doctorName} & ${params.patientName}`,
            description: `Specialisation: ${params.specialisation}\nReported Symptoms: ${params.symptoms}\nManaged via CarePulse Healthcare.`,
            start: { dateTime: startDateTime },
            end: { dateTime: endDateTime },
            attendees,
            conferenceData: {
              createRequest: {
                requestId: `carepulse-${Date.now()}`,
                conferenceSolutionKey: { type: 'hangoutsMeet' },
              },
            },
          },
        });

        const gcalEventId = res.data.id || mockEventId;
        const gcalMeetLink = res.data.hangoutLink || res.data.conferenceData?.entryPoints?.[0]?.uri || virtualMeetLink;

        logger.success(`Created Google Calendar event: ${gcalEventId}`);
        return { eventId: gcalEventId, meetLink: gcalMeetLink };
      }
    } catch (err: any) {
      logger.warn(`Google Calendar API event creation failed (${err.message}). Using virtual meeting link.`);
    }

    return {
      eventId: mockEventId,
      meetLink: virtualMeetLink,
    };
  }

  /**
   * Updates an existing Google Calendar event on reschedule
   */
  public async updateEvent(params: {
    userId: string;
    eventId?: string | null;
    date: string;
    startTime: string;
    endTime: string;
  }): Promise<boolean> {
    if (!params.eventId || params.eventId.startsWith('gcal-evt-')) {
      return true; // Mock event updated
    }

    try {
      const userToken = await prisma.googleOAuthToken.findUnique({
        where: { userId: params.userId },
      });

      if (this.oauth2Client && userToken) {
        this.oauth2Client.setCredentials({
          access_token: userToken.accessToken,
          refresh_token: userToken.refreshToken || undefined,
        });

        const calendar = google.calendar({ version: 'v3', auth: this.oauth2Client });

        const startDateTime = new Date(`${params.date}T${params.startTime}:00`).toISOString();
        const endDateTime = new Date(`${params.date}T${params.endTime}:00`).toISOString();

        await calendar.events.patch({
          calendarId: 'primary',
          eventId: params.eventId,
          requestBody: {
            start: { dateTime: startDateTime },
            end: { dateTime: endDateTime },
          },
        });

        logger.success(`Updated Google Calendar event ${params.eventId}`);
        return true;
      }
    } catch (err: any) {
      logger.warn(`Failed to update Google Calendar event ${params.eventId}:`, err.message);
    }
    return false;
  }

  /**
   * Deletes a Google Calendar event on cancellation
   */
  public async deleteEvent(params: { userId: string; eventId?: string | null }): Promise<boolean> {
    if (!params.eventId || params.eventId.startsWith('gcal-evt-')) {
      return true; // Mock event deleted
    }

    try {
      const userToken = await prisma.googleOAuthToken.findUnique({
        where: { userId: params.userId },
      });

      if (this.oauth2Client && userToken) {
        this.oauth2Client.setCredentials({
          access_token: userToken.accessToken,
          refresh_token: userToken.refreshToken || undefined,
        });

        const calendar = google.calendar({ version: 'v3', auth: this.oauth2Client });
        await calendar.events.delete({
          calendarId: 'primary',
          eventId: params.eventId,
        });

        logger.success(`Deleted Google Calendar event ${params.eventId}`);
        return true;
      }
    } catch (err: any) {
      logger.warn(`Failed to delete Google Calendar event ${params.eventId}:`, err.message);
    }
    return false;
  }
}

export const calendarService = new CalendarService();
