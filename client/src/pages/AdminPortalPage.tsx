import React, { useState } from 'react';
import { AdminDashboard } from '../components/admin/AdminDashboard.js';
import { DoctorManager } from '../components/admin/DoctorManager.js';
import { LeaveManager } from '../components/admin/LeaveManager.js';
import { EmailAuditQueue } from '../components/admin/EmailAuditQueue.js';
import {
  ShieldCheck,
  LayoutDashboard,
  Stethoscope,
  Calendar,
  Mail,
} from 'lucide-react';

export const AdminPortalPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'DASHBOARD' | 'DOCTORS' | 'LEAVES' | 'EMAILS'>('DASHBOARD');

  return (
    <div className="space-y-8 py-4">
      {/* Header & Sub-tabs */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2">
            <ShieldCheck className="w-6 h-6 text-indigo-500" />
            Clinic Administration & System Health
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Monitor clinical volume, manage doctor schedules, resolve leave conflicts, and audit email queues.
          </p>
        </div>

        {/* Tab Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setActiveTab('DASHBOARD')}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'DASHBOARD'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-800 hover:bg-slate-100'
            }`}
          >
            <LayoutDashboard className="w-3.5 h-3.5" />
            <span>Dashboard</span>
          </button>

          <button
            onClick={() => setActiveTab('DOCTORS')}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'DOCTORS'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-800 hover:bg-slate-100'
            }`}
          >
            <Stethoscope className="w-3.5 h-3.5" />
            <span>Doctor Roster</span>
          </button>

          <button
            onClick={() => setActiveTab('LEAVES')}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'LEAVES'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-800 hover:bg-slate-100'
            }`}
          >
            <Calendar className="w-3.5 h-3.5" />
            <span>Leave Registry</span>
          </button>

          <button
            onClick={() => setActiveTab('EMAILS')}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'EMAILS'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-800 hover:bg-slate-100'
            }`}
          >
            <Mail className="w-3.5 h-3.5" />
            <span>Email Audit Queue</span>
          </button>
        </div>
      </div>

      {/* Tab Panels */}
      {activeTab === 'DASHBOARD' && <AdminDashboard />}
      {activeTab === 'DOCTORS' && <DoctorManager />}
      {activeTab === 'LEAVES' && <LeaveManager />}
      {activeTab === 'EMAILS' && <EmailAuditQueue />}
    </div>
  );
};
