import React, { useState, useEffect } from 'react';
import { Prescription, MedicationReminder } from '../../types/index.js';
import { appointmentApi } from '../../services/api.js';
import { useToast } from '../../context/ToastContext.js';
import { Pill, CheckCircle2, Clock, Calendar, AlertCircle } from 'lucide-react';

export const MedicationTracker: React.FC = () => {
  const { success, error } = useToast();
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
  const [todayReminders, setTodayReminders] = useState<MedicationReminder[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    fetchMedications();
  }, []);

  const fetchMedications = async () => {
    try {
      setLoading(true);
      const res = await appointmentApi.getPatientMedications();
      if (res.data.success) {
        setPrescriptions(res.data.prescriptions || []);
        setTodayReminders(res.data.todayReminders || []);
      }
    } catch (err) {
      console.error('Failed to fetch medications', err);
    } finally {
      setLoading(false);
    }
  };

  const handleMarkTaken = async (reminderId: string) => {
    try {
      const res = await appointmentApi.markMedicationTaken(reminderId);
      if (res.data.success) {
        success('Dose marked as taken! Great adherence.');
        fetchMedications();
      }
    } catch (err: any) {
      error(err.response?.data?.message || 'Failed to update dose status.');
    }
  };

  const takenCount = todayReminders.filter((r) => r.status === 'TAKEN').length;
  const totalCount = todayReminders.length;
  const adherencePercentage = totalCount > 0 ? Math.round((takenCount / totalCount) * 100) : 100;

  return (
    <div className="space-y-6">
      {/* Adherence Card */}
      <div className="glass-card rounded-2xl p-6 bg-gradient-to-br from-emerald-500/10 to-teal-500/10 border border-emerald-500/20 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-emerald-500 text-white flex items-center justify-center shadow-lg shadow-emerald-500/30">
            <Pill className="w-7 h-7" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              Medication & Dosage Adherence
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Automated reminders dispatched according to your prescription frequency.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="text-right">
            <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400">
              {takenCount} / {totalCount}
            </div>
            <div className="text-[11px] text-slate-400 font-medium">Doses Taken Today</div>
          </div>
          <div className="w-12 h-12 rounded-full border-4 border-emerald-500/20 border-t-emerald-500 flex items-center justify-center text-xs font-bold text-emerald-600 dark:text-emerald-400">
            {adherencePercentage}%
          </div>
        </div>
      </div>

      {/* Today's Schedule Checklist */}
      <div className="glass-card rounded-2xl p-6 space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
          <h4 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Clock className="w-4 h-4 text-brand-500" />
            Today's Medication Doses
          </h4>
          <span className="text-xs font-semibold text-slate-400">
            {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}
          </span>
        </div>

        {loading ? (
          <div className="space-y-3 animate-pulse">
            {[1, 2].map((i) => (
              <div key={i} className="h-16 rounded-xl bg-slate-100 dark:bg-slate-800" />
            ))}
          </div>
        ) : todayReminders.length === 0 ? (
          <div className="text-center py-8 text-xs text-slate-400">
            No medication doses scheduled for today.
          </div>
        ) : (
          <div className="space-y-2.5">
            {todayReminders.map((reminder) => {
              const isTaken = reminder.status === 'TAKEN';
              return (
                <div
                  key={reminder.id}
                  className={`p-3.5 rounded-xl border flex items-center justify-between gap-3 transition-all ${
                    isTaken
                      ? 'bg-emerald-50/60 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-900/50'
                      : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${isTaken ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300' : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300'}`}>
                      <Clock className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-slate-900 dark:text-white">
                        {reminder.prescription?.medicationName} ({reminder.prescription?.dosage})
                      </div>
                      <div className="text-[11px] text-slate-500 flex items-center gap-2">
                        <span>Scheduled: {reminder.scheduledTime}</span>
                        {reminder.prescription?.instructions && (
                          <span>• {reminder.prescription.instructions}</span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div>
                    {isTaken ? (
                      <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-950 px-2.5 py-1 rounded-lg">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Taken
                      </span>
                    ) : (
                      <button
                        onClick={() => handleMarkTaken(reminder.id)}
                        className="px-3.5 py-1.5 rounded-lg text-xs font-bold bg-brand-500 hover:bg-brand-600 text-white shadow-sm transition-all"
                      >
                        Mark Taken
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Active Prescriptions Table */}
      <div className="glass-card rounded-2xl p-6 space-y-4">
        <h4 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <Pill className="w-4 h-4 text-brand-500" />
          Active Prescriptions
        </h4>

        {prescriptions.length === 0 ? (
          <div className="text-center py-6 text-xs text-slate-400">
            No active prescriptions on file.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {prescriptions.map((rx) => (
              <div
                key={rx.id}
                className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 space-y-2"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <h5 className="text-xs font-bold text-slate-900 dark:text-white">
                      {rx.medicationName}
                    </h5>
                    <span className="text-[11px] font-semibold text-brand-600 dark:text-brand-400">
                      {rx.dosage} • {rx.frequency}
                    </span>
                  </div>
                  <span className="text-[10px] font-bold bg-slate-200 dark:bg-slate-800 px-2 py-0.5 rounded text-slate-600 dark:text-slate-300">
                    {rx.durationDays} Days
                  </span>
                </div>
                {rx.instructions && (
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 italic">
                    "{rx.instructions}"
                  </p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
