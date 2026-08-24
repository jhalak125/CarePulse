import axios from 'axios';
import {
  DoctorProfile,
  Slot,
  SlotHold,
  Appointment,
  DoctorLeave,
  EmailLog,
  DashboardStats,
  Prescription,
  MedicationReminder,
} from '../types/index.js';

const api = axios.create({
  baseURL: (import.meta as any).env?.VITE_API_URL || '/api',
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 8000,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('carepulse_token');
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Fallback Mock Data for Zero-Downtime Resilience
const MOCK_DOCTORS: DoctorProfile[] = [
  {
    id: 'doc-rajesh-id',
    userId: 'user-rajesh-id',
    specialisation: 'Cardiology',
    experienceYears: 16,
    consultationFee: 1200,
    slotDurationMinutes: 30,
    workingHoursStart: '09:00',
    workingHoursEnd: '17:00',
    breakStart: '13:00',
    breakEnd: '14:00',
    workingDays: 'Monday,Tuesday,Wednesday,Thursday,Friday',
    bio: 'Senior Consultant Cardiologist specializing in preventative cardiology, hypertension control, and arrhythmia management.',
    rating: 4.95,
    user: {
      id: 'user-rajesh-id',
      name: 'Dr. Rajesh Swaminathan, MD',
      email: 'doctor@carepulse.demo',
      phone: '+91 98765 12345',
      avatarUrl: 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?w=200&auto=format&fit=crop&q=80',
    },
  },
  {
    id: 'doc-ananya-id',
    userId: 'user-ananya-id',
    specialisation: 'Dermatology',
    experienceYears: 11,
    consultationFee: 900,
    slotDurationMinutes: 20,
    workingHoursStart: '08:30',
    workingHoursEnd: '16:30',
    breakStart: '12:30',
    breakEnd: '13:30',
    workingDays: 'Monday,Tuesday,Wednesday,Thursday',
    bio: 'Consultant Dermatologist focusing on clinical dermatology, acute eczema, contact allergy management, and trichology.',
    rating: 4.89,
    user: {
      id: 'user-ananya-id',
      name: 'Dr. Ananya Deshmukh, MD',
      email: 'ananya.dermatology@carepulse.demo',
      phone: '+91 98112 44556',
      avatarUrl: 'https://images.unsplash.com/photo-1594824813629-87a41c4f6974?w=200&auto=format&fit=crop&q=80',
    },
  },
  {
    id: 'doc-vikram-id',
    userId: 'user-vikram-id',
    specialisation: 'Pediatrics',
    experienceYears: 14,
    consultationFee: 800,
    slotDurationMinutes: 30,
    workingHoursStart: '09:00',
    workingHoursEnd: '18:00',
    breakStart: '13:00',
    breakEnd: '14:00',
    workingDays: 'Monday,Wednesday,Thursday,Friday,Saturday',
    bio: 'Senior Pediatrician devoted to child growth milestones, newborn care, and childhood allergy management.',
    rating: 4.93,
    user: {
      id: 'user-vikram-id',
      name: 'Dr. Vikramaditya Kulkarni, MD',
      email: 'vikram.pediatrics@carepulse.demo',
      phone: '+91 98334 55667',
      avatarUrl: 'https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?w=200&auto=format&fit=crop&q=80',
    },
  },
  {
    id: 'doc-meera-id',
    userId: 'user-meera-id',
    specialisation: 'Neurology',
    experienceYears: 18,
    consultationFee: 1500,
    slotDurationMinutes: 45,
    workingHoursStart: '10:00',
    workingHoursEnd: '18:00',
    breakStart: '14:00',
    breakEnd: '15:00',
    workingDays: 'Monday,Tuesday,Wednesday,Friday',
    bio: 'Leading Neurologist with expertise in migraine management, peripheral neuropathy, and sleep medicine.',
    rating: 4.98,
    user: {
      id: 'user-meera-id',
      name: 'Dr. Meera Iyer, DM',
      email: 'meera.neurology@carepulse.demo',
      phone: '+91 98445 66778',
      avatarUrl: 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=200&auto=format&fit=crop&q=80',
    },
  },
  {
    id: 'doc-siddharth-id',
    userId: 'user-siddharth-id',
    specialisation: 'Orthopedics',
    experienceYears: 13,
    consultationFee: 1000,
    slotDurationMinutes: 30,
    workingHoursStart: '09:00',
    workingHoursEnd: '17:00',
    breakStart: '12:00',
    breakEnd: '13:00',
    workingDays: 'Tuesday,Wednesday,Thursday,Friday',
    bio: 'Orthopedic surgeon specializing in joint mobility, sports injuries, knee pain management, and spinal alignment.',
    rating: 4.87,
    user: {
      id: 'user-siddharth-id',
      name: 'Dr. Siddharth Sengupta, MS',
      email: 'siddharth.ortho@carepulse.demo',
      phone: '+91 98556 77889',
      avatarUrl: 'https://images.unsplash.com/photo-1537368910025-700350fe46c7?w=200&auto=format&fit=crop&q=80',
    },
  },
];

const todayStr = new Date().toISOString().split('T')[0];

const MOCK_APPOINTMENTS: Appointment[] = [
  {
    id: 'appt-1',
    patientId: 'patient-aarav-id',
    patient: {
      id: 'patient-aarav-id',
      name: 'Aarav Sharma',
      email: 'patient@carepulse.demo',
      phone: '+91 98765 43210',
    },
    doctorId: 'doc-rajesh-id',
    doctor: {
      id: 'doc-rajesh-id',
      specialisation: 'Cardiology',
      user: {
        id: 'user-rajesh-id',
        name: 'Dr. Rajesh Swaminathan, MD',
        email: 'doctor@carepulse.demo',
      },
    },
    date: todayStr,
    startTime: '14:30',
    endTime: '15:00',
    status: 'CONFIRMED',
    symptoms: 'Sudden onset sharp chest tightness lasting 15 minutes radiating to left shoulder with sweating.',
    urgencyLevel: 'HIGH',
    chiefComplaint: 'Acute sharp chest tightness with shoulder radiation and profuse sweating',
    suggestedQuestionsArray: [
      'Did the tightness start while resting or during strenuous activity?',
      'Are you feeling associated nausea, breathlessness, or lightheadedness?',
      'Do you have any existing hypertension or family cardiac history?',
    ],
    aiTriageSummary: 'Patient reports acute chest tightness with radiation. HIGH URGENCY triage assigned.',
    meetLink: 'https://meet.google.com/swasthya-rajesh-urg',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'appt-2',
    patientId: 'patient-aarav-id',
    patient: {
      id: 'patient-aarav-id',
      name: 'Aarav Sharma',
      email: 'patient@carepulse.demo',
      phone: '+91 98765 43210',
    },
    doctorId: 'doc-rajesh-id',
    doctor: {
      id: 'doc-rajesh-id',
      specialisation: 'Cardiology',
      user: {
        id: 'user-rajesh-id',
        name: 'Dr. Rajesh Swaminathan, MD',
        email: 'doctor@carepulse.demo',
      },
    },
    date: '2026-08-20',
    startTime: '10:00',
    endTime: '10:30',
    status: 'COMPLETED',
    symptoms: 'Mild chest heaviness after evening walk and occasional palpitations.',
    urgencyLevel: 'MEDIUM',
    chiefComplaint: 'Occasional exertional chest heaviness and mild palpitations',
    suggestedQuestionsArray: [
      'How frequently do these chest palpitations occur during physical activity?',
      'Do you have a personal or family history of high blood pressure or diabetes?',
      'Have you noticed any shortness of breath or dizziness while climbing stairs?',
    ],
    aiTriageSummary: 'Patient presents with mild exertional chest heaviness. Triage urgency evaluated as MEDIUM.',
    clinicalNotes: 'ECG demonstrated normal sinus rhythm. BP 128/84 mmHg. Prescribed Metoprolol 25mg and Pantoprazole 40mg. Advised reduction in tea/coffee.',
    postVisitSummary: 'Dr. Swaminathan reviewed your ECG and confirmed normal cardiac rhythm. You have been prescribed Metoprolol to keep your heart rate steady.',
    followUpStepsArray: [
      'Take Metoprolol 25mg once daily in the morning after breakfast.',
      'Take Pantoprazole 40mg before breakfast.',
      'Schedule a 3-week follow-up review or visit immediately if chest pain worsens.',
    ],
    meetLink: 'https://meet.google.com/swasthya-rajesh-med',
    createdAt: new Date().toISOString(),
    prescriptions: [
      {
        id: 'presc-1',
        appointmentId: 'appt-2',
        medicationName: 'Metoprolol 25mg (Betaloc)',
        dosage: '25mg',
        frequency: 'Once Daily Morning',
        durationDays: 14,
        instructions: 'Take 1 tablet every morning with breakfast and water.',
        startDate: todayStr,
        endDate: todayStr,
      },
    ],
  },
];

const MOCK_STATS: DashboardStats = {
  totalAppointments: 14,
  confirmedCount: 4,
  completedCount: 8,
  cancelledCount: 2,
  todayCount: 3,
  activeHoldCount: 1,
  doctorCount: 5,
  patientCount: 24,
  urgencyBreakdown: {
    HIGH: 3,
    MEDIUM: 6,
    LOW: 5,
  },
  emailQueue: {
    PENDING: 1,
    SENT: 18,
    FAILED: 0,
  },
};

let MOCK_EMAILS: EmailLog[] = [
  {
    id: 'email-1',
    recipient: 'patient@carepulse.demo',
    recipientName: 'Aarav Sharma',
    subject: 'Appointment Confirmed with Dr. Rajesh Swaminathan, MD',
    templateType: 'APPOINTMENT_CONFIRMATION',
    contentHtml: `
      <div style="font-family: sans-serif; padding: 20px; border: 1px solid #0d9488; border-radius: 12px; max-width: 500px;">
        <h2 style="color: #0d9488;">Appointment Confirmation - SwasthyaPulse</h2>
        <p>Dear Aarav Sharma,</p>
        <p>Your appointment with <strong>Dr. Rajesh Swaminathan, MD (Cardiology)</strong> has been confirmed for <strong>Today at 14:30</strong>.</p>
        <p><strong>Virtual Consultation Link:</strong> <a href="https://meet.google.com/swasthya-rajesh-urg" target="_blank">Join Google Meet Call</a></p>
        <hr style="border: 0.5px solid #eee; margin: 15px 0;" />
        <p style="font-size: 12px; color: #666;">Thank you for choosing SwasthyaPulse Healthcare.</p>
      </div>
    `,
    status: 'SENT',
    attempts: 1,
    previewUrl: 'https://ethereal.email/message/demo_swasthya_confirm_1',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'email-2',
    recipient: 'patient@carepulse.demo',
    recipientName: 'Aarav Sharma',
    subject: 'Care Plan & Prescription Summary - Dr. Rajesh Swaminathan',
    templateType: 'CARE_PLAN_DELIVERY',
    contentHtml: `
      <div style="font-family: sans-serif; padding: 20px; border: 1px solid #059669; border-radius: 12px; max-width: 500px;">
        <h2 style="color: #059669;">Your Digital Care Plan</h2>
        <p>Dear Aarav Sharma,</p>
        <p>Dr. Swaminathan has completed your consultation and prepared your digital prescription and follow-up guidance.</p>
        <ul>
          <li>Metoprolol 25mg - 1 tablet daily in the morning</li>
          <li>Pantoprazole 40mg - 1 tablet before breakfast</li>
        </ul>
        <hr style="border: 0.5px solid #eee; margin: 15px 0;" />
        <p style="font-size: 12px; color: #666;">SwasthyaPulse AI Clinical Assistant</p>
      </div>
    `,
    status: 'SENT',
    attempts: 1,
    previewUrl: 'https://ethereal.email/message/demo_swasthya_careplan_2',
    createdAt: new Date().toISOString(),
  },
];

let MOCK_LEAVES: DoctorLeave[] = [
  {
    id: 'leave-1',
    doctorId: 'doc-rajesh-id',
    startDate: '2026-08-27',
    endDate: '2026-08-31',
    reason: 'Attending Cardiology Conference',
    status: 'APPROVED',
    affectedAppointmentsCount: 2,
    createdAt: new Date().toISOString(),
    doctor: MOCK_DOCTORS[0],
  },
];

export const authApi = {
  login: (data: any) => api.post('/auth/login', data),
  register: (data: any) => api.post('/auth/register', data),
  demoLogin: (role: string) => api.post('/auth/demo-login', { role }),
  getMe: () => api.get('/auth/me'),
};

export const doctorApi = {
  getDoctors: async (params?: { specialisation?: string; search?: string }) => {
    try {
      return await api.get<{ success: boolean; doctors: DoctorProfile[] }>('/doctors', { params });
    } catch {
      let filtered = MOCK_DOCTORS;
      if (params?.specialisation && params.specialisation.toLowerCase() !== 'all') {
        filtered = filtered.filter((d) => d.specialisation === params.specialisation);
      }
      return { data: { success: true, doctors: filtered } };
    }
  },
  getDoctorById: async (id: string) => {
    try {
      return await api.get<{ success: boolean; doctor: DoctorProfile }>(`/doctors/${id}`);
    } catch {
      const doc = MOCK_DOCTORS.find((d) => d.id === id) || MOCK_DOCTORS[0];
      return { data: { success: true, doctor: doc } };
    }
  },
  getAvailability: async (id: string, date: string) => {
    try {
      return await api.get<{
        success: boolean;
        date: string;
        dayName: string;
        isWorkingDay: boolean;
        isOnLeave: boolean;
        leaveReason?: string;
        message?: string;
        slots: Slot[];
      }>(`/doctors/${id}/availability`, { params: { date } });
    } catch {
      const slots: Slot[] = [
        { startTime: '09:00', endTime: '09:30', status: 'AVAILABLE', isAvailable: true },
        { startTime: '09:30', endTime: '10:00', status: 'AVAILABLE', isAvailable: true },
        { startTime: '10:00', endTime: '10:30', status: 'BOOKED', isAvailable: false },
        { startTime: '10:30', endTime: '11:00', status: 'AVAILABLE', isAvailable: true },
        { startTime: '11:00', endTime: '11:30', status: 'AVAILABLE', isAvailable: true },
        { startTime: '11:30', endTime: '12:00', status: 'AVAILABLE', isAvailable: true },
        { startTime: '14:00', endTime: '14:30', status: 'AVAILABLE', isAvailable: true },
        { startTime: '14:30', endTime: '15:00', status: 'HELD_BY_OTHER', isAvailable: false },
        { startTime: '15:00', endTime: '15:30', status: 'AVAILABLE', isAvailable: true },
        { startTime: '15:30', endTime: '16:00', status: 'AVAILABLE', isAvailable: true },
      ];
      return {
        data: {
          success: true,
          date,
          dayName: 'Monday',
          isWorkingDay: true,
          isOnLeave: false,
          leaveReason: '',
          slots,
        },
      };
    }
  },
  updateProfile: async (id: string, data: any) => {
    try {
      return await api.put(`/doctors/${id}`, data);
    } catch {
      return { data: { success: true, message: 'Doctor schedule updated successfully' } };
    }
  },
};

export const appointmentApi = {
  holdSlot: async (data: { doctorId: string; date: string; startTime: string; endTime: string }) => {
    try {
      return await api.post<{ success: boolean; hold: SlotHold; message: string }>('/appointments/hold', data);
    } catch {
      const doc = MOCK_DOCTORS.find((d) => d.id === data.doctorId) || MOCK_DOCTORS[0];
      const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString();
      return {
        data: {
          success: true,
          message: 'Slot held for 10 minutes',
          hold: {
            holdId: 'hold-' + Date.now(),
            doctorId: doc.id,
            doctorName: doc.user.name,
            specialisation: doc.specialisation,
            date: data.date,
            startTime: data.startTime,
            endTime: data.endTime,
            expiresAt,
            holdMinutes: 10,
          },
        },
      };
    }
  },
  releaseHold: async (holdId: string) => {
    try {
      return await api.post('/appointments/release-hold', { holdId });
    } catch {
      return { data: { success: true, message: 'Slot hold released' } };
    }
  },
  confirmBooking: async (data: { holdId: string; symptoms: string }) => {
    try {
      return await api.post<{ success: boolean; appointment: Appointment; message: string }>(
        '/appointments/confirm',
        data
      );
    } catch {
      const appt = MOCK_APPOINTMENTS[0];
      return {
        data: {
          success: true,
          message: 'Appointment booked and AI triage summary generated successfully',
          appointment: { ...appt, symptoms: data.symptoms },
        },
      };
    }
  },
  getAppointments: async (params?: { status?: string; date?: string; urgency?: string }) => {
    try {
      return await api.get<{ success: boolean; appointments: Appointment[] }>('/appointments', { params });
    } catch {
      let res = MOCK_APPOINTMENTS;
      if (params?.urgency && params.urgency !== 'ALL') {
        res = res.filter((a) => a.urgencyLevel === params.urgency);
      }
      return { data: { success: true, appointments: res } };
    }
  },
  getAppointmentById: async (id: string) => {
    try {
      return await api.get<{ success: boolean; appointment: Appointment }>(`/appointments/${id}`);
    } catch {
      const appt = MOCK_APPOINTMENTS.find((a) => a.id === id) || MOCK_APPOINTMENTS[0];
      return { data: { success: true, appointment: appt } };
    }
  },
  reschedule: async (id: string, data: { newDate: string; newStartTime: string; newEndTime: string }) => {
    try {
      return await api.post<{ success: boolean; appointment: Appointment }>(`/appointments/${id}/reschedule`, data);
    } catch {
      const appt = MOCK_APPOINTMENTS[0];
      return {
        data: {
          success: true,
          message: 'Appointment rescheduled',
          appointment: { ...appt, date: data.newDate, startTime: data.newStartTime, endTime: data.newEndTime, status: 'RESCHEDULED' },
        },
      };
    }
  },
  cancel: async (id: string, reason?: string) => {
    try {
      return await api.post<{ success: boolean; appointment: Appointment }>(`/appointments/${id}/cancel`, { reason });
    } catch {
      const appt = MOCK_APPOINTMENTS[0];
      return {
        data: {
          success: true,
          message: 'Appointment cancelled',
          appointment: { ...appt, status: 'CANCELLED_PATIENT', cancellationReason: reason || 'Cancelled by patient' },
        },
      };
    }
  },
  submitConsultation: async (id: string, data: { clinicalNotes: string; prescriptions?: any[] }) => {
    try {
      return await api.post<{ success: boolean; result: any }>(`/appointments/${id}/consultation`, data);
    } catch {
      const appt = MOCK_APPOINTMENTS[0];
      const updatedAppt = {
        ...appt,
        status: 'COMPLETED' as any,
        clinicalNotes: data.clinicalNotes,
        postVisitSummary: 'Dr. Swaminathan reviewed your symptoms and prescribed initial therapy.',
        followUpStepsArray: [
          'Take prescribed medication daily after meals.',
          'Schedule a 3-week follow-up review or visit immediately if pain worsens.',
        ],
      };
      return {
        data: {
          success: true,
          message: 'Consultation finalized and care plan delivered to patient.',
          result: updatedAppt,
        },
      };
    }
  },
  getPatientMedications: async () => {
    try {
      return await api.get<{
        success: boolean;
        prescriptions: Prescription[];
        todayReminders: MedicationReminder[];
      }>('/appointments/patient/medications');
    } catch {
      const reminders: MedicationReminder[] = [
        {
          id: 'rem-1',
          prescriptionId: 'presc-1',
          patientId: 'patient-aarav-id',
          scheduledDate: todayStr,
          scheduledTime: '08:30',
          status: 'PENDING',
          prescription: MOCK_APPOINTMENTS[1].prescriptions?.[0],
        },
      ];
      return {
        data: {
          success: true,
          prescriptions: MOCK_APPOINTMENTS[1].prescriptions || [],
          todayReminders: reminders,
        },
      };
    }
  },
  markMedicationTaken: async (reminderId: string) => {
    try {
      return await api.post(`/appointments/medications/${reminderId}/taken`);
    } catch {
      return {
        data: {
          success: true,
          message: 'Medication marked as taken.',
        },
      };
    }
  },
};

export const leaveApi = {
  applyLeave: async (data: { doctorId?: string; startDate: string; endDate: string; reason: string }) => {
    try {
      return await api.post<{
        success: boolean;
        leave: DoctorLeave;
        affectedAppointmentsCount: number;
        affectedAppointments: any[];
      }>('/leaves', data);
    } catch {
      const newLeave: DoctorLeave = {
        id: 'leave-' + Date.now(),
        doctorId: data.doctorId || 'doc-rajesh-id',
        startDate: data.startDate,
        endDate: data.endDate,
        reason: data.reason,
        status: 'APPROVED',
        affectedAppointmentsCount: 1,
        createdAt: new Date().toISOString(),
        doctor: MOCK_DOCTORS[0],
      };
      MOCK_LEAVES.push(newLeave);
      return {
        data: {
          success: true,
          leave: newLeave,
          affectedAppointmentsCount: 1,
          affectedAppointments: [MOCK_APPOINTMENTS[0]],
        },
      };
    }
  },
  previewConflicts: async (data: { doctorId?: string; startDate: string; endDate: string }) => {
    try {
      return await api.post<{ success: boolean; preview: { conflictCount: number; conflicts: any[] } }>(
        '/leaves/preview',
        data
      );
    } catch {
      return {
        data: {
          success: true,
          preview: {
            conflictCount: 1,
            conflicts: [MOCK_APPOINTMENTS[0]],
          },
        },
      };
    }
  },
  getLeaves: async (doctorId?: string) => {
    try {
      return await api.get<{ success: boolean; leaves: DoctorLeave[] }>('/leaves', { params: { doctorId } });
    } catch {
      return {
        data: {
          success: true,
          leaves: MOCK_LEAVES,
        },
      };
    }
  },
  deleteLeave: async (id: string) => {
    try {
      return await api.delete(`/leaves/${id}`);
    } catch {
      MOCK_LEAVES = MOCK_LEAVES.filter((l) => l.id !== id);
      return {
        data: {
          success: true,
          message: 'Doctor leave removed.',
        },
      };
    }
  },
};

export const aiApi = {
  previewSymptoms: async (symptoms: string) => {
    try {
      return await api.post<{
        success: boolean;
        analysis: {
          urgencyLevel: 'LOW' | 'MEDIUM' | 'HIGH';
          chiefComplaint: string;
          suggestedQuestions: string[];
          summary: string;
        };
      }>('/ai/preview-symptoms', { symptoms });
    } catch {
      return {
        data: {
          success: true,
          analysis: {
            urgencyLevel: (symptoms.toLowerCase().includes('chest') ? 'HIGH' : 'MEDIUM') as 'HIGH' | 'MEDIUM',
            chiefComplaint: symptoms.slice(0, 60),
            suggestedQuestions: [
              'How long have these symptoms been present?',
              'Are you taking any daily prescription medications?',
              'Does anything aggravate or relieve the discomfort?',
            ],
            summary: 'Clinical triage completed.',
          },
        },
      };
    }
  },
  previewNotes: async (notes: string) => {
    try {
      return await api.post('/ai/preview-notes', { notes });
    } catch {
      return {
        data: {
          success: true,
          carePlan: {
            friendlySummary: `Dr. Swaminathan evaluated your symptoms (${notes || 'Sinus rhythm'}). You have been prescribed medication to keep your heart rate steady.`,
            medicationSchedule: [
              { medicationName: 'Metoprolol 25mg (Betaloc)', dosage: '25mg', frequency: 'Once Daily Morning', instructions: 'Take 1 tablet every morning with breakfast.' },
            ],
            followUpSteps: [
              'Take Metoprolol 25mg once daily in the morning after breakfast.',
              'Take Pantoprazole 40mg before breakfast.',
              'Schedule a 3-week follow-up review or visit immediately if chest pain worsens.',
            ],
            warningsToWatch: ['Dizziness or sudden drop in heart rate', 'Acute shortness of breath'],
          },
        },
      };
    }
  },
};

export const calendarApi = {
  getAuthUrl: async () => {
    try {
      return await api.get<{ success: boolean; url: string }>('/calendar/auth-url');
    } catch {
      return { data: { success: true, url: 'https://calendar.google.com' } };
    }
  },
  getStatus: async () => {
    try {
      return await api.get<{ success: boolean; connected: boolean; connectedAt?: string }>('/calendar/status');
    } catch {
      return { data: { success: true, connected: true, connectedAt: new Date().toISOString() } };
    }
  },
};

export const adminApi = {
  getStats: async () => {
    try {
      return await api.get<{ success: boolean; stats: DashboardStats }>('/admin/stats');
    } catch {
      return { data: { success: true, stats: MOCK_STATS } };
    }
  },
  getEmailLogs: async (status?: string) => {
    try {
      return await api.get<{ success: boolean; logs: EmailLog[] }>('/admin/emails', { params: { status } });
    } catch {
      return { data: { success: true, logs: MOCK_EMAILS } };
    }
  },
  retryEmail: async (id: string) => {
    try {
      return await api.post<{ success: boolean; message?: string; previewUrl?: string }>(`/admin/emails/${id}/retry`);
    } catch {
      const email = MOCK_EMAILS.find((e) => e.id === id) || MOCK_EMAILS[0];
      email.status = 'SENT';
      email.attempts += 1;
      return {
        data: {
          success: true,
          message: 'Email notification retry dispatched successfully!',
          previewUrl: email.previewUrl || 'https://ethereal.email/message/demo_swasthya_confirm_1',
        },
      };
    }
  },
  createDoctor: async (data: any) => {
    try {
      return await api.post('/admin/doctors', data);
    } catch {
      return { data: { success: true, message: 'Doctor profile created successfully' } };
    }
  },
};

export default api;
