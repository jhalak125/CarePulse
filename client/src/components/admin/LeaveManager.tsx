import React, { useState, useEffect } from 'react';
import { DoctorLeave } from '../../types/index.js';
import { leaveApi } from '../../services/api.js';
import { useToast } from '../../context/ToastContext.js';
import { Calendar, Users, Trash2, CheckCircle2, ShieldAlert } from 'lucide-react';

export const LeaveManager: React.FC = () => {
  const { success, error } = useToast();
  const [leaves, setLeaves] = useState<DoctorLeave[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    fetchLeaves();
  }, []);

  const fetchLeaves = async () => {
    try {
      setLoading(true);
      const res = await leaveApi.getLeaves();
      if (res.data.success) {
        setLeaves(res.data.leaves);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteLeave = async (id: string) => {
    try {
      const res = await leaveApi.deleteLeave(id);
      if (res.data.success) {
        success('Doctor leave schedule removed.');
        fetchLeaves();
      }
    } catch (err: any) {
      error(err.response?.data?.message || 'Failed to remove leave.');
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <ShieldAlert className="w-5 h-5 text-amber-500" />
          Doctor Leave & Conflict Resolution Registry
        </h3>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
          History of doctor scheduled out-of-office leaves and automated patient impact resolutions.
        </p>
      </div>

      {loading ? (
        <div className="space-y-3 animate-pulse">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-20 glass-card rounded-2xl" />
          ))}
        </div>
      ) : leaves.length === 0 ? (
        <div className="text-center py-12 glass-card rounded-2xl">
          <Calendar className="w-12 h-12 mx-auto text-slate-300 dark:text-slate-600 mb-2" />
          <h4 className="text-sm font-bold text-slate-700 dark:text-slate-300">
            No doctor leaves recorded
          </h4>
          <p className="text-xs text-slate-400 mt-1">All specialists are active on their standard schedules.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {leaves.map((l) => (
            <div
              key={l.id}
              className="glass-card-hover rounded-2xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
            >
              <div className="space-y-1.5">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold text-slate-900 dark:text-white">
                    {l.doctor?.user.name}
                  </span>
                  <span className="text-xs font-semibold text-teal-600 dark:text-teal-400">
                    ({l.doctor?.specialisation})
                  </span>
                </div>

                <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500 dark:text-slate-400">
                  <div className="flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5 text-slate-400" />
                    <span>
                      {l.startDate} &rarr; {l.endDate}
                    </span>
                  </div>
                  <div className="flex items-center gap-1 font-semibold text-amber-600 dark:text-amber-400">
                    <Users className="w-3.5 h-3.5" />
                    <span>{l.affectedAppointmentsCount} Patients Auto-Notified</span>
                  </div>
                </div>

                <p className="text-xs text-slate-600 dark:text-slate-300 italic">
                  Reason: "{l.reason}"
                </p>
              </div>

              <button
                onClick={() => handleDeleteLeave(l.id)}
                className="p-2 text-slate-400 hover:text-rose-600 rounded-xl hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors self-start sm:self-center"
                title="Delete Leave"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
