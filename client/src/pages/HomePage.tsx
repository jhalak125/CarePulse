import React from 'react';
import {
  Activity,
  Calendar,
  Sparkles,
  ShieldCheck,
  Stethoscope,
  Pill,
  Clock,
  CheckCircle2,
  Lock,
  ArrowRight,
} from 'lucide-react';

interface HomePageProps {
  onNavigate: (tab: 'patient' | 'doctor' | 'admin') => void;
}

export const HomePage: React.FC<HomePageProps> = ({ onNavigate }) => {
  return (
    <div className="space-y-16 py-8">
      {/* Hero Section */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-navy-900 to-slate-950 text-white p-8 sm:p-14 border border-slate-800 shadow-2xl">
        <div className="relative z-10 max-w-3xl space-y-6">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-brand-500/10 border border-brand-500/30 text-brand-400 text-xs font-bold uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Next-Gen Healthcare Management</span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight leading-tight">
            Intelligent Appointments & Continuous Follow-up Care
          </h1>

          <p className="text-slate-300 text-sm sm:text-base leading-relaxed">
            Eliminate double-booking conflicts with atomic slot holds, empower physicians with AI-driven pre-visit triage briefings, and deliver compassionate post-visit care plans with automated medication adherence tracking.
          </p>

          <div className="flex flex-wrap items-center gap-3 pt-2">
            <button
              onClick={() => onNavigate('patient')}
              className="px-6 py-3.5 rounded-xl bg-brand-500 hover:bg-brand-600 text-white font-bold text-sm flex items-center gap-2 shadow-lg shadow-brand-500/30 transition-all hover:scale-105"
            >
              <span>Book Appointment as Patient</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            <button
              onClick={() => onNavigate('doctor')}
              className="px-6 py-3.5 rounded-xl bg-teal-600/30 hover:bg-teal-600/40 text-teal-300 border border-teal-500/30 font-bold text-sm flex items-center gap-2 transition-all"
            >
              <Stethoscope className="w-4 h-4" />
              <span>Doctor Portal</span>
            </button>

            <button
              onClick={() => onNavigate('admin')}
              className="px-6 py-3.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-sm flex items-center gap-2 transition-all"
            >
              <ShieldCheck className="w-4 h-4" />
              <span>Admin Center</span>
            </button>
          </div>
        </div>

        {/* Decorative Background Elements */}
        <div className="absolute -right-20 -bottom-20 w-96 h-96 bg-brand-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute right-40 top-10 w-72 h-72 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />
      </div>

      {/* 4 Core Pillars Section */}
      <div>
        <div className="text-center max-w-2xl mx-auto space-y-2 mb-10">
          <h2 className="text-2xl font-black text-slate-900 dark:text-white">
            Engineered for Clinical Precision & Patient Trust
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            A battle-tested architecture solving concurrency, clinical communication, and notification reliability.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Pillar 1 */}
          <div className="glass-card rounded-2xl p-6 space-y-3">
            <div className="w-12 h-12 rounded-xl bg-teal-500/10 text-teal-600 dark:text-teal-400 flex items-center justify-center">
              <Sparkles className="w-6 h-6" />
            </div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              AI Clinical Triage
            </h3>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              Analyzes symptoms in advance to classify urgency (Low / Med / High), distill chief complaints, and arm doctors with 3 targeted diagnostic questions.
            </p>
          </div>

          {/* Pillar 2 */}
          <div className="glass-card rounded-2xl p-6 space-y-3">
            <div className="w-12 h-12 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center">
              <Lock className="w-6 h-6" />
            </div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              Atomic 10m Slot Holds
            </h3>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              Prevents double-booking and split-second race conditions by locking selected slots with a 10-minute hold reservation clock.
            </p>
          </div>

          {/* Pillar 3 */}
          <div className="glass-card rounded-2xl p-6 space-y-3">
            <div className="w-12 h-12 rounded-xl bg-rose-500/10 text-rose-600 dark:text-rose-400 flex items-center justify-center">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              Doctor Leave Resolver
            </h3>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              When doctors schedule leave, overlapping bookings are atomically cancelled and affected patients receive immediate reschedule notifications.
            </p>
          </div>

          {/* Pillar 4 */}
          <div className="glass-card rounded-2xl p-6 space-y-3">
            <div className="w-12 h-12 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
              <Pill className="w-6 h-6" />
            </div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              Automated Follow-ups
            </h3>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              Converts doctor notes to patient-friendly summaries, schedules prescription reminders, and manages background email retries.
            </p>
          </div>
        </div>
      </div>

      {/* 3 Portal Quick Access Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Patient Portal Card */}
        <div
          onClick={() => onNavigate('patient')}
          className="glass-card-hover rounded-2xl p-6 cursor-pointer space-y-4 border-t-4 border-t-brand-500"
        >
          <div className="flex items-center justify-between">
            <h4 className="text-base font-bold text-slate-900 dark:text-white">Patient Portal</h4>
            <span className="text-xs font-bold text-brand-600 dark:text-brand-400 bg-brand-50 dark:bg-brand-950 px-2.5 py-1 rounded-full">
              Explore &rarr;
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Search top specialists, reserve slots with live countdown locks, submit symptoms for AI triage, and track daily medications.
          </p>
        </div>

        {/* Doctor Portal Card */}
        <div
          onClick={() => onNavigate('doctor')}
          className="glass-card-hover rounded-2xl p-6 cursor-pointer space-y-4 border-t-4 border-t-teal-500"
        >
          <div className="flex items-center justify-between">
            <h4 className="text-base font-bold text-slate-900 dark:text-white">Doctor Portal</h4>
            <span className="text-xs font-bold text-teal-600 dark:text-teal-400 bg-teal-50 dark:bg-teal-950 px-2.5 py-1 rounded-full">
              Explore &rarr;
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            View prioritized daily queues, review AI pre-visit clinical questions, prescribe medications, and schedule out-of-office leaves.
          </p>
        </div>

        {/* Admin Portal Card */}
        <div
          onClick={() => onNavigate('admin')}
          className="glass-card-hover rounded-2xl p-6 cursor-pointer space-y-4 border-t-4 border-t-indigo-500"
        >
          <div className="flex items-center justify-between">
            <h4 className="text-base font-bold text-slate-900 dark:text-white">Admin Center</h4>
            <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950 px-2.5 py-1 rounded-full">
              Explore &rarr;
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Clinic-wide KPIs, AI urgency distributions, doctor roster management, and real-time email audit logs with HTML previews.
          </p>
        </div>
      </div>
    </div>
  );
};
