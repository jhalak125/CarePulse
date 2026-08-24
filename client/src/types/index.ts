export type Role = 'PATIENT' | 'DOCTOR' | 'ADMIN';

export type UrgencyLevel = 'LOW' | 'MEDIUM' | 'HIGH';

export type AppointmentStatus =
  | 'CONFIRMED'
  | 'COMPLETED'
  | 'CANCELLED_BY_PATIENT'
  | 'CANCELLED_DOCTOR_LEAVE'
  | 'RESCHEDULED';

export type SlotHoldStatus = 'ACTIVE' | 'CONFIRMED' | 'EXPIRED' | 'RELEASED';

export interface User {
  id: string;
  email: string;
  name: string;
  role: Role;
  phone?: string | null;
  avatarUrl?: string | null;
  doctorProfile?: DoctorProfile | null;
  doctorProfileId?: string | null;
  hasGoogleCalendar?: boolean;
}

export interface DoctorProfile {
  id: string;
  userId: string;
  user: {
    id: string;
    name: string;
    email: string;
    phone?: string | null;
    avatarUrl?: string | null;
  };
  specialisation: string;
  experienceYears: number;
  consultationFee: number;
  slotDurationMinutes: number;
  workingHoursStart: string;
  workingHoursEnd: string;
  breakStart?: string | null;
  breakEnd?: string | null;
  workingDays: string;
  bio?: string | null;
  rating: number;
  leaves?: DoctorLeave[];
}

export interface Slot {
  startTime: string; // HH:mm
  endTime: string; // HH:mm
  status: 'AVAILABLE' | 'HELD_BY_YOU' | 'HELD_BY_OTHER' | 'BOOKED';
  isAvailable: boolean;
  expiresAt?: string | null;
}

export interface SlotHold {
  holdId: string;
  doctorId: string;
  doctorName: string;
  specialisation: string;
  date: string;
  startTime: string;
  endTime: string;
  expiresAt: string;
  holdMinutes: number;
}

export interface Appointment {
  id: string;
  patientId: string;
  patient: {
    id: string;
    name: string;
    email: string;
    phone?: string | null;
  };
  doctorId: string;
  doctor: {
    id: string;
    specialisation: string;
    user: {
      id: string;
      name: string;
      email: string;
    };
  };
  date: string;
  startTime: string;
  endTime: string;
  status: AppointmentStatus;
  symptoms: string;
  urgencyLevel: UrgencyLevel;
  chiefComplaint?: string | null;
  suggestedQuestions?: string | null;
  suggestedQuestionsArray?: string[];
  aiTriageSummary?: string | null;
  clinicalNotes?: string | null;
  postVisitSummary?: string | null;
  followUpSteps?: string | null;
  followUpStepsArray?: string[];
  googleCalendarEventId?: string | null;
  meetLink?: string | null;
  cancellationReason?: string | null;
  createdAt: string;
  prescriptions?: Prescription[];
}

export interface Prescription {
  id: string;
  appointmentId: string;
  medicationName: string;
  dosage: string;
  frequency: string;
  durationDays: number;
  instructions?: string | null;
  startDate: string;
  endDate: string;
  reminders?: MedicationReminder[];
}

export interface MedicationReminder {
  id: string;
  prescriptionId: string;
  prescription?: Prescription;
  patientId: string;
  scheduledDate: string;
  scheduledTime: string;
  status: 'PENDING' | 'SENT' | 'TAKEN' | 'MISSED';
  sentAt?: string | null;
  takenAt?: string | null;
}

export interface DoctorLeave {
  id: string;
  doctorId: string;
  doctor?: DoctorProfile;
  startDate: string;
  endDate: string;
  reason: string;
  status: 'APPROVED' | 'PENDING' | 'REJECTED';
  affectedAppointmentsCount: number;
  createdAt: string;
}

export interface EmailLog {
  id: string;
  recipient: string;
  recipientName?: string | null;
  subject: string;
  templateType: string;
  contentHtml: string;
  status: 'PENDING' | 'SENT' | 'FAILED';
  attempts: number;
  lastError?: string | null;
  nextAttemptAt?: string | null;
  previewUrl?: string | null;
  createdAt: string;
}

export interface DashboardStats {
  totalAppointments: number;
  confirmedCount: number;
  completedCount: number;
  cancelledCount: number;
  todayCount: number;
  activeHoldCount: number;
  doctorCount: number;
  patientCount: number;
  urgencyBreakdown: {
    HIGH: number;
    MEDIUM: number;
    LOW: number;
  };
  emailQueue: {
    PENDING: number;
    SENT: number;
    FAILED: number;
  };
}
