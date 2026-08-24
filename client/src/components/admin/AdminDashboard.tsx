import React, { useState, useEffect } from 'react';
import { DashboardStats } from '../../types/index.js';
import { adminApi } from '../../services/api.js';
import { StatCard } from '../common/StatCard.js';
import {
  Calendar,
  Users,
  Stethoscope,
  Clock,
  Mail,
  AlertCircle,
  Activity,
  CheckCircle2,
  Lock,
} from 'lucide-react';

export const AdminDashboard: React.FC = () => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      setLoading(true);
      const res = await adminApi.getStats();
      if (res.data.success) {
        setStats(res.data.stats);
      }
    } catch (err) {
      console.error('Failed to load admin stats', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading || !stats) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 animate-pulse">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-32 glass-card rounded-2xl" />
        ))}
      </div>
    );
  }

  const totalUrgency =
    stats.urgencyBreakdown.HIGH +
    stats.urgencyBreakdown.MEDIUM +
    stats.urgencyBreakdown.LOW || 1;

  const highPct = Math.round((stats.urgencyBreakdown.HIGH / totalUrgency) * 100);
  const medPct = Math.round((stats.urgencyBreakdown.MEDIUM / totalUrgency) * 100);
  const lowPct = Math.round((stats.urgencyBreakdown.LOW / totalUrgency) * 100);

  return (
    <div className="space-y-6">
      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Consultations"
          value={stats.totalAppointments}
          subtitle={`${stats.confirmedCount} Active, ${stats.completedCount} Completed`}
          icon={<Calendar className="w-5 h-5" />}
          colorScheme="teal"
        />

        <StatCard
          title="Today's Clinic Queue"
          value={stats.todayCount}
          subtitle="Visits scheduled for today"
          icon={<Activity className="w-5 h-5" />}
          colorScheme="indigo"
        />

        <StatCard
          title="Active Doctors"
          value={stats.doctorCount}
          subtitle={`${stats.patientCount} Registered Patients`}
          icon={<Stethoscope className="w-5 h-5" />}
          colorScheme="emerald"
        />

        <StatCard
          title="Email Queue Status"
          value={`${stats.emailQueue.SENT} Sent`}
          subtitle={`${stats.emailQueue.PENDING} Pending, ${stats.emailQueue.FAILED} Failed`}
          icon={<Mail className="w-5 h-5" />}
          colorScheme={stats.emailQueue.FAILED > 0 ? 'rose' : 'teal'}
        />
      </div>

      {/* Analytics & Urgency Breakdown Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Triage Urgency Distribution */}
        <div className="glass-card rounded-2xl p-6 space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
            <h4 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-500" />
              AI Clinical Triage Distribution
            </h4>
            <span className="text-xs text-slate-400">All Time</span>
          </div>

          <div className="space-y-3 pt-2">
            {/* High */}
            <div>
              <div className="flex justify-between text-xs font-bold mb-1 text-rose-600 dark:text-rose-400">
                <span>HIGH URGENCY</span>
                <span>{stats.urgencyBreakdown.HIGH} ({highPct}%)</span>
              </div>
              <div className="w-full h-2.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                <div className="h-full bg-rose-500 rounded-full" style={{ width: `${highPct}%` }} />
              </div>
            </div>

            {/* Medium */}
            <div>
              <div className="flex justify-between text-xs font-bold mb-1 text-amber-600 dark:text-amber-400">
                <span>MEDIUM URGENCY</span>
                <span>{stats.urgencyBreakdown.MEDIUM} ({medPct}%)</span>
              </div>
              <div className="w-full h-2.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                <div className="h-full bg-amber-500 rounded-full" style={{ width: `${medPct}%` }} />
              </div>
            </div>

            {/* Low */}
            <div>
              <div className="flex justify-between text-xs font-bold mb-1 text-emerald-600 dark:text-emerald-400">
                <span>LOW URGENCY</span>
                <span>{stats.urgencyBreakdown.LOW} ({lowPct}%)</span>
              </div>
              <div className="w-full h-2.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${lowPct}%` }} />
              </div>
            </div>
          </div>
        </div>

        {/* Appointment Status Breakdown */}
        <div className="glass-card rounded-2xl p-6 space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
            <h4 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-brand-500" />
              Appointment Status Breakdown
            </h4>
          </div>

          <div className="space-y-3 pt-2 text-xs">
            <div className="flex items-center justify-between p-3 rounded-xl bg-teal-50 dark:bg-teal-950/40 border border-teal-200 dark:border-teal-900">
              <span className="font-bold text-teal-800 dark:text-teal-200">Confirmed & Upcoming</span>
              <span className="text-sm font-extrabold text-teal-900 dark:text-teal-100">{stats.confirmedCount}</span>
            </div>

            <div className="flex items-center justify-between p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900">
              <span className="font-bold text-emerald-800 dark:text-emerald-200">Completed & Care Plan Delivered</span>
              <span className="text-sm font-extrabold text-emerald-900 dark:text-emerald-100">{stats.completedCount}</span>
            </div>

            <div className="flex items-center justify-between p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900">
              <span className="font-bold text-rose-800 dark:text-rose-200">Cancelled (Patient / Doctor Leave)</span>
              <span className="text-sm font-extrabold text-rose-900 dark:text-rose-100">{stats.cancelledCount}</span>
            </div>
          </div>
        </div>

        {/* Concurrency & System Reliability Stats */}
        <div className="glass-card rounded-2xl p-6 space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
            <h4 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Lock className="w-4 h-4 text-amber-500" />
              Slot Locks & System Concurrency
            </h4>
          </div>

          <div className="space-y-3 pt-2 text-xs text-slate-600 dark:text-slate-300">
            <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900 flex items-center justify-between">
              <div>
                <div className="font-bold text-amber-900 dark:text-amber-200">Active 10-Minute Holds</div>
                <div className="text-[11px] text-amber-700 dark:text-amber-400">Locking slots against race conditions</div>
              </div>
              <div className="text-lg font-black text-amber-900 dark:text-amber-100">{stats.activeHoldCount}</div>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-1">
              <div className="font-bold text-slate-800 dark:text-slate-100">Automatic Cron Workers:</div>
              <ul className="text-[11px] space-y-1 text-slate-500 dark:text-slate-400">
                <li>• <strong>Slot Cleanup:</strong> Every 1 min (releases expired holds)</li>
                <li>• <strong>Medication Alert:</strong> Every 2 min (dispatches doses)</li>
                <li>• <strong>Email Retries:</strong> Exponential backoff (max 5)</li>
                <li>• <strong>24h/2h Alerts:</strong> Automated pre-visit emails</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
