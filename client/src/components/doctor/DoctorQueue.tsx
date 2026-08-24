import React, { useState, useEffect } from 'react';
import { Appointment } from '../../types/index.js';
import { appointmentApi } from '../../services/api.js';
import { UrgencyBadge, StatusBadge } from '../common/Badge.js';
import {
  Calendar,
  Clock,
  User,
  Video,
  Sparkles,
  Stethoscope,
  ExternalLink,
  Search,
} from 'lucide-react';

interface DoctorQueueProps {
  onOpenBrief: (appointment: Appointment) => void;
  onOpenConsultation: (appointment: Appointment) => void;
  refreshTrigger?: number;
}

export const DoctorQueue: React.FC<DoctorQueueProps> = ({
  onOpenBrief,
  onOpenConsultation,
  refreshTrigger,
}) => {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [filterUrgency, setFilterUrgency] = useState<string>('ALL');

  useEffect(() => {
    fetchQueue();
  }, [refreshTrigger, filterUrgency]);

  const fetchQueue = async () => {
    try {
      setLoading(true);
      const res = await appointmentApi.getAppointments({
        urgency: filterUrgency !== 'ALL' ? filterUrgency : undefined,
      });
      if (res.data.success) {
        setAppointments(res.data.appointments);
      }
    } catch (err) {
      console.error('Failed to load doctor appointments', err);
    } finally {
      setLoading(false);
    }
  };

  const todayStr = new Date().toISOString().split('T')[0];
  const todayAppointments = appointments.filter((a) => a.date === todayStr);

  return (
    <div className="space-y-6">
      {/* Queue Header Filters */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Stethoscope className="w-5 h-5 text-teal-500" />
            Patient Consultation Queue ({appointments.length} total)
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Prioritized by triage urgency level with instant AI pre-visit briefing.
          </p>
        </div>

        {/* Urgency Filter Pills */}
        <div className="flex items-center gap-1.5 self-start sm:self-center">
          {['ALL', 'HIGH', 'MEDIUM', 'LOW'].map((lvl) => (
            <button
              key={lvl}
              onClick={() => setFilterUrgency(lvl)}
              className={`px-3 py-1 rounded-full text-xs font-bold transition-all ${
                filterUrgency === lvl
                  ? 'bg-teal-600 text-white shadow-sm'
                  : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700'
              }`}
            >
              {lvl}
            </button>
          ))}
        </div>
      </div>

      {/* Appointment Queue Cards */}
      {loading ? (
        <div className="space-y-3 animate-pulse">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-28 glass-card rounded-2xl" />
          ))}
        </div>
      ) : appointments.length === 0 ? (
        <div className="text-center py-12 glass-card rounded-2xl">
          <Calendar className="w-12 h-12 mx-auto text-slate-300 dark:text-slate-600 mb-2" />
          <h4 className="text-sm font-bold text-slate-700 dark:text-slate-300">
            No patient bookings found in this filter
          </h4>
        </div>
      ) : (
        <div className="space-y-3.5">
          {appointments.map((appt) => {
            const isToday = appt.date === todayStr;
            const isCompleted = appt.status === 'COMPLETED';

            return (
              <div
                key={appt.id}
                className={`glass-card-hover rounded-2xl p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-l-4 ${
                  appt.urgencyLevel === 'HIGH'
                    ? 'border-l-rose-500 bg-rose-50/10'
                    : appt.urgencyLevel === 'MEDIUM'
                    ? 'border-l-amber-500'
                    : 'border-l-emerald-500'
                }`}
              >
                <div className="space-y-2 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <UrgencyBadge level={appt.urgencyLevel} size="sm" />
                    <StatusBadge status={appt.status} />
                    {isToday && (
                      <span className="text-[10px] font-bold uppercase tracking-wider bg-teal-500 text-white px-2 py-0.5 rounded-full">
                        Today
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-3">
                    <h4 className="text-base font-bold text-slate-900 dark:text-white">
                      {appt.patient.name}
                    </h4>
                    <span className="text-xs text-slate-400">
                      ({appt.patient.email})
                    </span>
                  </div>

                  <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500 dark:text-slate-400">
                    <div className="flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5 text-slate-400" />
                      <span>{appt.date}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-slate-400" />
                      <span>{appt.startTime} - {appt.endTime}</span>
                    </div>
                  </div>

                  {/* Symptoms & Chief Complaint Snippet */}
                  <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 text-xs text-slate-700 dark:text-slate-300">
                    <strong>Chief Complaint:</strong> {appt.chiefComplaint || appt.symptoms}
                  </div>
                </div>

                {/* Doctor Action Buttons */}
                <div className="flex flex-wrap items-center gap-2 self-start lg:self-center">
                  {/* AI Pre-Visit Briefing Button */}
                  <button
                    onClick={() => onOpenBrief(appt)}
                    className="px-3.5 py-2 rounded-xl text-xs font-bold bg-teal-50 hover:bg-teal-100 dark:bg-teal-950/60 dark:hover:bg-teal-900/60 text-teal-700 dark:text-teal-300 border border-teal-200 dark:border-teal-800 flex items-center gap-1.5 transition-all shadow-sm"
                  >
                    <Sparkles className="w-4 h-4 text-teal-500" />
                    <span>AI Pre-Visit Brief</span>
                  </button>

                  {/* Meet Link */}
                  {appt.meetLink && appt.status === 'CONFIRMED' && (
                    <a
                      href={appt.meetLink}
                      target="_blank"
                      rel="noreferrer"
                      className="px-3 py-2 rounded-xl text-xs font-bold bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-200 flex items-center gap-1 transition-all"
                    >
                      <Video className="w-3.5 h-3.5 text-slate-500" />
                      <span>Join Call</span>
                    </a>
                  )}

                  {/* Consultation / Care Plan Workspace Button */}
                  <button
                    onClick={() => onOpenConsultation(appt)}
                    className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all ${
                      isCompleted
                        ? 'bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-200'
                        : 'bg-teal-600 hover:bg-teal-700 text-white shadow-teal-600/30'
                    }`}
                  >
                    <Stethoscope className="w-3.5 h-3.5" />
                    <span>{isCompleted ? 'View Consultation' : 'Conduct Visit & Prescribe'}</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
