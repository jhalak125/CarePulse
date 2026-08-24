import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext.js';
import { DoctorProfile, SlotHold, Appointment } from '../types/index.js';
import { DoctorSearch } from '../components/patient/DoctorSearch.js';
import { SlotPicker } from '../components/patient/SlotPicker.js';
import { SymptomForm } from '../components/patient/SymptomForm.js';
import { AppointmentList } from '../components/patient/AppointmentList.js';
import { MedicationTracker } from '../components/patient/MedicationTracker.js';
import {
  Calendar,
  Clock,
  Pill,
  Sparkles,
  CheckCircle2,
  Stethoscope,
  Video,
  ArrowRight,
  ShieldCheck,
  User,
} from 'lucide-react';

export const PatientPortalPage: React.FC = () => {
  const { user, isAuthenticated, demoLogin } = useAuth();

  const [activeTab, setActiveTab] = useState<'BOOK' | 'APPOINTMENTS' | 'MEDICATIONS'>('BOOK');

  // Booking Flow Steps: 'SEARCH' | 'SLOTS' | 'SYMPTOMS' | 'SUCCESS'
  const [bookingStep, setBookingStep] = useState<'SEARCH' | 'SLOTS' | 'SYMPTOMS' | 'SUCCESS'>('SEARCH');
  const [selectedDoctor, setSelectedDoctor] = useState<DoctorProfile | null>(null);
  const [activeHold, setActiveHold] = useState<SlotHold | null>(null);
  const [confirmedAppt, setConfirmedAppt] = useState<Appointment | null>(null);
  const [refreshTrigger, setRefreshTrigger] = useState<number>(0);

  const handleSelectDoctor = (doc: DoctorProfile) => {
    setSelectedDoctor(doc);
    setBookingStep('SLOTS');
  };

  const handleSlotHeld = (hold: SlotHold) => {
    setActiveHold(hold);
    setBookingStep('SYMPTOMS');
  };

  const handleBookingSuccess = (appt: Appointment) => {
    setConfirmedAppt(appt);
    setBookingStep('SUCCESS');
    setRefreshTrigger((prev) => prev + 1);
  };

  const handleResetBooking = () => {
    setSelectedDoctor(null);
    setActiveHold(null);
    setConfirmedAppt(null);
    setBookingStep('SEARCH');
  };

  return (
    <div className="space-y-8 py-4">
      {/* Header and Sub-Tabs */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2">
            <User className="w-6 h-6 text-brand-500" />
            Patient Care Portal
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Book appointments with atomic slot holds, submit symptoms for AI triage, and track medications.
          </p>
        </div>

        {/* Tab Buttons */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              setActiveTab('BOOK');
              handleResetBooking();
            }}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'BOOK'
                ? 'bg-brand-500 text-white shadow-md shadow-brand-500/20'
                : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-800 hover:bg-slate-100'
            }`}
          >
            Schedule Visit
          </button>

          <button
            onClick={() => setActiveTab('APPOINTMENTS')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'APPOINTMENTS'
                ? 'bg-brand-500 text-white shadow-md shadow-brand-500/20'
                : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-800 hover:bg-slate-100'
            }`}
          >
            My Appointments
          </button>

          <button
            onClick={() => setActiveTab('MEDICATIONS')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'MEDICATIONS'
                ? 'bg-brand-500 text-white shadow-md shadow-brand-500/20'
                : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-800 hover:bg-slate-100'
            }`}
          >
            Medication Tracker
          </button>
        </div>
      </div>

      {/* Main Tab Content */}
      {activeTab === 'BOOK' && (
        <div className="space-y-6">
          {/* Step 1: Doctor Search */}
          {bookingStep === 'SEARCH' && (
            <DoctorSearch onSelectDoctor={handleSelectDoctor} />
          )}

          {/* Step 2: Slot Picker */}
          {bookingStep === 'SLOTS' && selectedDoctor && (
            <SlotPicker
              doctor={selectedDoctor}
              onSlotHeld={handleSlotHeld}
              onCancel={handleResetBooking}
            />
          )}

          {/* Step 3: Symptom Form */}
          {bookingStep === 'SYMPTOMS' && activeHold && (
            <SymptomForm
              hold={activeHold}
              onBack={() => setBookingStep('SLOTS')}
              onBookingSuccess={handleBookingSuccess}
            />
          )}

          {/* Step 4: Success Card */}
          {bookingStep === 'SUCCESS' && confirmedAppt && (
            <div className="glass-card rounded-3xl p-8 max-w-2xl mx-auto text-center space-y-6">
              <div className="w-16 h-16 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto shadow-xl shadow-emerald-500/20 animate-bounce">
                <CheckCircle2 className="w-10 h-10" />
              </div>

              <div className="space-y-2">
                <h3 className="text-2xl font-black text-slate-900 dark:text-white">
                  Appointment Confirmed!
                </h3>
                <p className="text-xs text-slate-600 dark:text-slate-300 max-w-md mx-auto">
                  Your appointment with <strong>{confirmedAppt.doctor.user.name}</strong> ({confirmedAppt.doctor.specialisation}) has been locked and synced.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 grid grid-cols-2 gap-3 text-xs text-left">
                <div>
                  <span className="text-slate-400 font-medium">Date:</span>
                  <div className="font-bold text-slate-900 dark:text-white">{confirmedAppt.date}</div>
                </div>
                <div>
                  <span className="text-slate-400 font-medium">Time Slot:</span>
                  <div className="font-bold text-slate-900 dark:text-white">{confirmedAppt.startTime} - {confirmedAppt.endTime}</div>
                </div>
                <div>
                  <span className="text-slate-400 font-medium">Urgency Triage:</span>
                  <div className="font-bold text-brand-600 dark:text-brand-400">{confirmedAppt.urgencyLevel} Urgency</div>
                </div>
                <div>
                  <span className="text-slate-400 font-medium">Google Calendar:</span>
                  <div className="font-bold text-emerald-600 dark:text-emerald-400">Synced & Reminder Set</div>
                </div>
              </div>

              {confirmedAppt.meetLink && (
                <div className="p-3 rounded-xl bg-teal-50 dark:bg-teal-950/40 border border-teal-200 dark:border-teal-900 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2 text-teal-800 dark:text-teal-200 font-semibold">
                    <Video className="w-4 h-4 text-teal-600" />
                    <span>Virtual Room Link:</span>
                  </div>
                  <a
                    href={confirmedAppt.meetLink}
                    target="_blank"
                    rel="noreferrer"
                    className="font-bold text-teal-600 dark:text-teal-400 hover:underline"
                  >
                    {confirmedAppt.meetLink}
                  </a>
                </div>
              )}

              <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
                <button
                  onClick={() => {
                    setActiveTab('APPOINTMENTS');
                    handleResetBooking();
                  }}
                  className="px-6 py-3 rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-xs font-bold transition-all shadow-md"
                >
                  View in My Appointments
                </button>
                <button
                  onClick={handleResetBooking}
                  className="px-6 py-3 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs font-bold transition-all"
                >
                  Book Another Visit
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {activeTab === 'APPOINTMENTS' && (
        <AppointmentList refreshTrigger={refreshTrigger} />
      )}

      {activeTab === 'MEDICATIONS' && <MedicationTracker />}
    </div>
  );
};
