import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext.js';
import { Appointment, DoctorProfile } from '../types/index.js';
import { doctorApi } from '../services/api.js';
import { DoctorQueue } from '../components/doctor/DoctorQueue.js';
import { AIPatientBrief } from '../components/doctor/AIPatientBrief.js';
import { ConsultationModal } from '../components/doctor/ConsultationModal.js';
import { DoctorLeaveModal } from '../components/doctor/DoctorLeaveModal.js';
import { DoctorScheduleSettings } from '../components/doctor/DoctorScheduleSettings.js';
import { LeaveManager } from '../components/admin/LeaveManager.js';
import { Modal } from '../components/common/Modal.js';
import {
  Stethoscope,
  Calendar,
  Clock,
  Sparkles,
  ShieldAlert,
  Settings,
  Plus,
} from 'lucide-react';

export const DoctorPortalPage: React.FC = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'QUEUE' | 'LEAVES' | 'SETTINGS'>('QUEUE');
  const [doctorProfile, setDoctorProfile] = useState<DoctorProfile | null>(null);

  // Selected appointment for AI briefing / Consultation
  const [selectedBriefAppt, setSelectedBriefAppt] = useState<Appointment | null>(null);
  const [selectedConsultAppt, setSelectedConsultAppt] = useState<Appointment | null>(null);
  const [isLeaveModalOpen, setIsLeaveModalOpen] = useState<boolean>(false);
  const [refreshTrigger, setRefreshTrigger] = useState<number>(0);

  useEffect(() => {
    fetchProfile();
  }, [user]);

  const fetchProfile = async () => {
    try {
      if (user?.doctorProfileId) {
        const res = await doctorApi.getDoctorById(user.doctorProfileId);
        if (res.data.success) {
          setDoctorProfile(res.data.doctor);
        }
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-8 py-4">
      {/* Header and Sub-Tabs */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2">
              <Stethoscope className="w-6 h-6 text-teal-500" />
              Physician Consultation Center
            </h1>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            AI pre-visit clinical triage, diagnostic history questions, prescription care plans, and leave management.
          </p>
        </div>

        {/* Tab Buttons & Leave Action */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setActiveTab('QUEUE')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'QUEUE'
                ? 'bg-teal-600 text-white shadow-md shadow-teal-600/20'
                : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-800 hover:bg-slate-100'
            }`}
          >
            Consultation Queue
          </button>

          <button
            onClick={() => setActiveTab('LEAVES')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'LEAVES'
                ? 'bg-teal-600 text-white shadow-md shadow-teal-600/20'
                : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-800 hover:bg-slate-100'
            }`}
          >
            Leave & Out-of-Office
          </button>

          {doctorProfile && (
            <button
              onClick={() => setActiveTab('SETTINGS')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                activeTab === 'SETTINGS'
                  ? 'bg-teal-600 text-white shadow-md shadow-teal-600/20'
                  : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-800 hover:bg-slate-100'
              }`}
            >
              Clinic Schedule
            </button>
          )}

          <button
            onClick={() => setIsLeaveModalOpen(true)}
            className="px-3.5 py-2 rounded-xl text-xs font-bold bg-amber-500 hover:bg-amber-600 text-white shadow-sm flex items-center gap-1.5 transition-all"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Apply For Leave</span>
          </button>
        </div>
      </div>

      {/* Main Content */}
      {activeTab === 'QUEUE' && (
        <DoctorQueue
          onOpenBrief={(appt) => setSelectedBriefAppt(appt)}
          onOpenConsultation={(appt) => setSelectedConsultAppt(appt)}
          refreshTrigger={refreshTrigger}
        />
      )}

      {activeTab === 'LEAVES' && (
        <div className="space-y-6">
          <div className="glass-card rounded-2xl p-6 bg-gradient-to-br from-amber-500/10 to-teal-500/10 border border-amber-500/20 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="space-y-1">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Leave Management & Conflict Protection
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                When you schedule out-of-office days, all conflicting patient appointments will be automatically flagged and rescheduled, and patients will receive high-priority email alerts.
              </p>
            </div>

            <button
              onClick={() => setIsLeaveModalOpen(true)}
              className="px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold shadow-md transition-all whitespace-nowrap"
            >
              Schedule Leave Dates
            </button>
          </div>

          <LeaveManager />
        </div>
      )}

      {activeTab === 'SETTINGS' && doctorProfile && (
        <DoctorScheduleSettings
          doctor={doctorProfile}
          onUpdate={() => {
            fetchProfile();
            setRefreshTrigger((p) => p + 1);
          }}
        />
      )}

      {/* AI Pre-Visit Briefing Modal */}
      <Modal
        isOpen={Boolean(selectedBriefAppt)}
        onClose={() => setSelectedBriefAppt(null)}
        title="AI Pre-Visit Clinical Briefing"
        subtitle="Symptom triage, urgency level, and 3 recommended diagnostic questions"
        maxWidth="2xl"
      >
        {selectedBriefAppt && <AIPatientBrief appointment={selectedBriefAppt} />}
      </Modal>

      {/* Post-Visit Consultation & Prescription Modal */}
      <Modal
        isOpen={Boolean(selectedConsultAppt)}
        onClose={() => setSelectedConsultAppt(null)}
        title="Consultation Workspace & Care Plan"
        subtitle="Enter clinical notes, build structured prescriptions, and generate AI summary"
        maxWidth="3xl"
      >
        {selectedConsultAppt && (
          <ConsultationModal
            appointment={selectedConsultAppt}
            onSuccess={() => {
              setSelectedConsultAppt(null);
              setRefreshTrigger((p) => p + 1);
            }}
          />
        )}
      </Modal>

      {/* Apply Leave Modal */}
      <Modal
        isOpen={isLeaveModalOpen}
        onClose={() => setIsLeaveModalOpen(false)}
        title="Schedule Physician Out-of-Office Leave"
        subtitle="Automated conflict detection and patient rescheduling notifications"
        maxWidth="lg"
      >
        <DoctorLeaveModal
          onSuccess={() => {
            setIsLeaveModalOpen(false);
            setRefreshTrigger((p) => p + 1);
          }}
        />
      </Modal>
    </div>
  );
};
