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
});

// Request interceptor to attach JWT token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('carepulse_token');
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor for session expiry handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    return Promise.reject(error);
  }
);

export const authApi = {
  login: (data: any) => api.post('/auth/login', data),
  register: (data: any) => api.post('/auth/register', data),
  demoLogin: (role: string) => api.post('/auth/demo-login', { role }),
  getMe: () => api.get('/auth/me'),
};

export const doctorApi = {
  getDoctors: (params?: { specialisation?: string; search?: string }) =>
    api.get<{ success: boolean; doctors: DoctorProfile[] }>('/doctors', { params }),
  getDoctorById: (id: string) =>
    api.get<{ success: boolean; doctor: DoctorProfile }>(`/doctors/${id}`),
  getAvailability: (id: string, date: string) =>
    api.get<{
      success: boolean;
      date: string;
      dayName: string;
      isWorkingDay: boolean;
      isOnLeave: boolean;
      leaveReason?: string;
      message?: string;
      slots: Slot[];
    }>(`/doctors/${id}/availability`, { params: { date } }),
  updateProfile: (id: string, data: any) => api.put(`/doctors/${id}`, data),
};

export const appointmentApi = {
  holdSlot: (data: { doctorId: string; date: string; startTime: string; endTime: string }) =>
    api.post<{ success: boolean; hold: SlotHold; message: string }>('/appointments/hold', data),
  releaseHold: (holdId: string) =>
    api.post('/appointments/release-hold', { holdId }),
  confirmBooking: (data: { holdId: string; symptoms: string }) =>
    api.post<{ success: boolean; appointment: Appointment; message: string }>(
      '/appointments/confirm',
      data
    ),
  getAppointments: (params?: { status?: string; date?: string; urgency?: string }) =>
    api.get<{ success: boolean; appointments: Appointment[] }>('/appointments', { params }),
  getAppointmentById: (id: string) =>
    api.get<{ success: boolean; appointment: Appointment }>(`/appointments/${id}`),
  reschedule: (id: string, data: { newDate: string; newStartTime: string; newEndTime: string }) =>
    api.post<{ success: boolean; appointment: Appointment }>(`/appointments/${id}/reschedule`, data),
  cancel: (id: string, reason?: string) =>
    api.post<{ success: boolean; appointment: Appointment }>(`/appointments/${id}/cancel`, { reason }),
  submitConsultation: (id: string, data: { clinicalNotes: string; prescriptions?: any[] }) =>
    api.post<{ success: boolean; result: any }>(`/appointments/${id}/consultation`, data),
  getPatientMedications: () =>
    api.get<{
      success: boolean;
      prescriptions: Prescription[];
      todayReminders: MedicationReminder[];
    }>('/appointments/patient/medications'),
  markMedicationTaken: (reminderId: string) =>
    api.post(`/appointments/medications/${reminderId}/taken`),
};

export const leaveApi = {
  applyLeave: (data: { doctorId?: string; startDate: string; endDate: string; reason: string }) =>
    api.post<{
      success: boolean;
      leave: DoctorLeave;
      affectedAppointmentsCount: number;
      affectedAppointments: any[];
    }>('/leaves', data),
  previewConflicts: (data: { doctorId?: string; startDate: string; endDate: string }) =>
    api.post<{ success: boolean; preview: { conflictCount: number; conflicts: any[] } }>(
      '/leaves/preview',
      data
    ),
  getLeaves: (doctorId?: string) =>
    api.get<{ success: boolean; leaves: DoctorLeave[] }>('/leaves', { params: { doctorId } }),
  deleteLeave: (id: string) => api.delete(`/leaves/${id}`),
};

export const aiApi = {
  previewSymptoms: (symptoms: string) =>
    api.post<{
      success: boolean;
      analysis: {
        urgencyLevel: 'LOW' | 'MEDIUM' | 'HIGH';
        chiefComplaint: string;
        suggestedQuestions: string[];
        summary: string;
      };
    }>('/ai/preview-symptoms', { symptoms }),
  previewNotes: (notes: string) =>
    api.post<{
      success: boolean;
      carePlan: {
        friendlySummary: string;
        medicationSchedule: any[];
        followUpSteps: string[];
        warningsToWatch: string[];
      };
    }>('/ai/preview-notes', { notes }),
};

export const calendarApi = {
  getAuthUrl: () => api.get<{ success: boolean; url: string }>('/calendar/auth-url'),
  getStatus: () =>
    api.get<{ success: boolean; connected: boolean; connectedAt?: string }>('/calendar/status'),
};

export const adminApi = {
  getStats: () => api.get<{ success: boolean; stats: DashboardStats }>('/admin/stats'),
  getEmailLogs: (status?: string) =>
    api.get<{ success: boolean; logs: EmailLog[] }>('/admin/emails', { params: { status } }),
  retryEmail: (id: string) =>
    api.post<{ success: boolean; message?: string; previewUrl?: string }>(`/admin/emails/${id}/retry`),
  createDoctor: (data: any) => api.post('/admin/doctors', data),
};

export default api;
