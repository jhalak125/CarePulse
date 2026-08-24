import { Request, Response } from 'express';
import { calendarService } from '../services/calendar.service.js';
import { prisma } from '../prisma.js';
import { ENV } from '../config/env.js';

export class CalendarController {
  public async getAuthUrl(req: Request, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, message: 'Unauthorized' });
        return;
      }

      const url = calendarService.getAuthUrl(req.user.id);
      res.json({ success: true, url });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  }

  public async handleCallback(req: Request, res: Response): Promise<void> {
    try {
      const { code, state } = req.query;

      if (!code || !state || typeof code !== 'string' || typeof state !== 'string') {
        res.redirect(`${ENV.CLIENT_URL}/?google_oauth=failed`);
        return;
      }

      const success = await calendarService.handleOAuthCallback(code, state);
      if (success) {
        res.redirect(`${ENV.CLIENT_URL}/?google_oauth=success`);
      } else {
        res.redirect(`${ENV.CLIENT_URL}/?google_oauth=error`);
      }
    } catch (err: any) {
      res.redirect(`${ENV.CLIENT_URL}/?google_oauth=error`);
    }
  }

  public async getStatus(req: Request, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, message: 'Unauthorized' });
        return;
      }

      const token = await prisma.googleOAuthToken.findUnique({
        where: { userId: req.user.id },
      });

      res.json({
        success: true,
        connected: Boolean(token),
        connectedAt: token?.createdAt || null,
      });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  }
}

export const calendarController = new CalendarController();
