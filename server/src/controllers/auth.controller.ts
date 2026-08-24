import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { prisma } from '../prisma.js';
import { ENV } from '../config/env.js';

export class AuthController {
  public async register(req: Request, res: Response): Promise<void> {
    try {
      const { email, password, name, role = 'PATIENT', phone } = req.body;

      if (!email || !password || !name) {
        res.status(400).json({ success: false, message: 'Email, password, and name are required.' });
        return;
      }

      const existing = await prisma.user.findUnique({ where: { email } });
      if (existing) {
        res.status(400).json({ success: false, message: 'An account with this email already exists.' });
        return;
      }

      const hashedPassword = await bcrypt.hash(password, 10);
      const user = await prisma.user.create({
        data: {
          email,
          password: hashedPassword,
          name,
          role: role as 'PATIENT' | 'DOCTOR' | 'ADMIN',
          phone: phone || null,
        },
      });

      // If doctor role, create a default doctor profile
      if (user.role === 'DOCTOR') {
        await prisma.doctorProfile.create({
          data: {
            userId: user.id,
            specialisation: req.body.specialisation || 'General Medicine',
            experienceYears: req.body.experienceYears || 5,
            consultationFee: req.body.consultationFee || 60,
            slotDurationMinutes: req.body.slotDurationMinutes || 30,
            bio: req.body.bio || 'Experienced medical practitioner dedicated to patient wellness.',
          },
        });
      }

      const token = jwt.sign(
        { id: user.id, email: user.email, role: user.role },
        ENV.JWT_SECRET,
        { expiresIn: '7d' }
      );

      res.status(201).json({
        success: true,
        message: 'Account created successfully',
        token,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
        },
      });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  }

  public async login(req: Request, res: Response): Promise<void> {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        res.status(400).json({ success: false, message: 'Email and password are required' });
        return;
      }

      const user = await prisma.user.findUnique({
        where: { email },
        include: { doctorProfile: true },
      });

      if (!user) {
        res.status(401).json({ success: false, message: 'Invalid email or password' });
        return;
      }

      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) {
        res.status(401).json({ success: false, message: 'Invalid email or password' });
        return;
      }

      const token = jwt.sign(
        { id: user.id, email: user.email, role: user.role },
        ENV.JWT_SECRET,
        { expiresIn: '7d' }
      );

      res.json({
        success: true,
        token,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          doctorProfileId: user.doctorProfile?.id || null,
        },
      });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  }

  public async getMe(req: Request, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, message: 'Unauthorized' });
        return;
      }

      const user = await prisma.user.findUnique({
        where: { id: req.user.id },
        include: {
          doctorProfile: true,
          googleOAuthToken: { select: { id: true, scope: true, createdAt: true } },
        },
      });

      if (!user) {
        res.status(404).json({ success: false, message: 'User not found' });
        return;
      }

      res.json({
        success: true,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          phone: user.phone,
          avatarUrl: user.avatarUrl,
          doctorProfile: user.doctorProfile,
          hasGoogleCalendar: Boolean(user.googleOAuthToken),
        },
      });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  }

  public async demoLogin(req: Request, res: Response): Promise<void> {
    try {
      const { role = 'PATIENT' } = req.body;

      // Find standard demo accounts or first matching user of that role
      const user = await prisma.user.findFirst({
        where: { role: role as 'PATIENT' | 'DOCTOR' | 'ADMIN' },
        include: { doctorProfile: true },
      });

      if (!user) {
        res.status(404).json({ success: false, message: `No demo account found for role ${role}. Please seed database.` });
        return;
      }

      const token = jwt.sign(
        { id: user.id, email: user.email, role: user.role },
        ENV.JWT_SECRET,
        { expiresIn: '7d' }
      );

      res.json({
        success: true,
        token,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          doctorProfileId: user.doctorProfile?.id || null,
        },
      });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  }
}

export const authController = new AuthController();
