import React, { useState, useEffect } from 'react';
import { Appointment } from '../../types/index.js';
import { appointmentApi } from '../../services/api.js';
import { useToast } from '../../context/ToastContext.js';
import { UrgencyBadge, StatusBadge } from '../common/Badge.js';
import { Modal } from '../common/Modal.js';
import {
  Calendar,
  Clock,
  Video,
  FileText,
  Sparkles,
  Pill,
  XCircle,
  RotateCcw,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
} from 'lucide-react';

interface AppointmentListProps {
  refreshTrigger?: number;
}

export const AppointmentList: React.FC<AppointmentListProps> = ({ refreshTrigger }) => {
  const { success, error } = useToast();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<'UPCOMING' | 'COMPLETED' | 'CANCELLED'>('UPCOMING');
  const [selectedAppt, setSelectedAppt] = useState<Appointment | null>(null);

  // Reschedule & Cancel states
  const [isRescheduling, setIsRescheduling] = useState<boolean>(false);
  const [rescheduleDate, setRescheduleDate] = useState<string>('');
  const [rescheduleStart, setRescheduleStart] = useState<string>('10:00');
  const [rescheduleEnd, setRescheduleEnd] = useState<string>('10:30');
  const [cancelReason, setCancelReason] = useState<string>('');
  const [isCancelling, setIsCancelling] = useState<boolean>(false);

  useEffect(() => {
    fetchAppointments();
  }, [refreshTrigger]);

  const fetchAppointments = async () => {
    try {
      setLoading(true);
      const res = await appointmentApi.getAppointments();
      if (res.data.success) {
        setAppointments(res.data.appointments);
      }
    } catch (err) {
      console.error('Failed to load appointments', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = async () => {
    if (!selectedAppt) return;
    try {
      const res = await appointmentApi.cancel(selectedAppt.id, cancelReason);
      if (res.data.success) {
        success('Appointment cancelled successfully.');
        setIsCancelling(false);
        setSelectedAppt(null);
        fetchAppointments();
      }
    } catch (err: any) {
      error(err.response?.data?.message || 'Failed to cancel appointment.');
    }
  };

  const handleReschedule = async () => {
    if (!selectedAppt || !rescheduleDate || !rescheduleStart || !rescheduleEnd) {
      error('Please select date and slot time.');
      return;
    }
    try {
      const res = await appointmentApi.reschedule(selectedAppt.id, {
        newDate: rescheduleDate,
        newStartTime: rescheduleStart,
        newEndTime: rescheduleEnd,
      });
      if (res.data.success) {
        success('Appointment rescheduled successfully!');
        setIsRescheduling(false);
        setSelectedAppt(null);
        fetchAppointments();
      }
    } catch (err: any) {
      error(err.response?.data?.message || 'Failed to reschedule.');
    }
  };

  const filteredAppointments = appointments.filter((appt) => {
    if (activeTab === 'UPCOMING') return appt.status === 'CONFIRMED' || appt.status === 'RESCHEDULED';
    if (activeTab === 'COMPLETED') return appt.status === 'COMPLETED';
    return appt.status.startsWith('CANCELLED');
  });

  return (
    <div className="space-y-6">
      {/* Sub-tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-2">
        <button
          onClick={() => setActiveTab('UPCOMING')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'UPCOMING'
              ? 'bg-brand-500 text-white shadow-sm'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          Upcoming Confirmed ({appointments.filter((a) => a.status === 'CONFIRMED' || a.status === 'RESCHEDULED').length})
        </button>

        <button
          onClick={() => setActiveTab('COMPLETED')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'COMPLETED'
              ? 'bg-brand-500 text-white shadow-sm'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          Completed & Care Plans ({appointments.filter((a) => a.status === 'COMPLETED').length})
        </button>

        <button
          onClick={() => setActiveTab('CANCELLED')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'CANCELLED'
              ? 'bg-brand-500 text-white shadow-sm'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          Cancelled / Leave ({appointments.filter((a) => a.status.startsWith('CANCELLED')).length})
        </button>
      </div>

      {/* Appointment Cards Grid */}
      {loading ? (
        <div className="space-y-3 animate-pulse">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-28 glass-card rounded-2xl" />
          ))}
        </div>
      ) : filteredAppointments.length === 0 ? (
        <div className="text-center py-12 glass-card rounded-2xl">
          <Calendar className="w-12 h-12 mx-auto text-slate-300 dark:text-slate-600 mb-2" />
          <h4 className="text-sm font-bold text-slate-700 dark:text-slate-300">
            No appointments found in this category
          </h4>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredAppointments.map((appt) => (
            <div
              key={appt.id}
              className="glass-card-hover rounded-2xl p-5 flex flex-col md:flex-row md:items-center justify-between gap-4"
            >
              <div className="space-y-2">
                <div className="flex flex-wrap items-center gap-2">
                  <StatusBadge status={appt.status} />
                  <UrgencyBadge level={appt.urgencyLevel} size="sm" />
                  <span className="text-xs font-semibold text-brand-600 dark:text-brand-400">
                    {appt.doctor.specialisation}
                  </span>
                </div>

                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  {appt.doctor.user.name}
                </h3>

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

                {appt.chiefComplaint && (
                  <p className="text-xs text-slate-600 dark:text-slate-300 line-clamp-1 italic">
                    "{appt.chiefComplaint}"
                  </p>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center gap-2 self-start md:self-center">
                {appt.meetLink && appt.status === 'CONFIRMED' && (
                  <a
                    href={appt.meetLink}
                    target="_blank"
                    rel="noreferrer"
                    className="px-3 py-2 rounded-xl text-xs font-bold bg-teal-50 hover:bg-teal-100 text-teal-700 dark:bg-teal-950 dark:text-teal-300 border border-teal-200 dark:border-teal-800 flex items-center gap-1.5 transition-all"
                  >
                    <Video className="w-3.5 h-3.5" />
                    <span>Join Consultation</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                )}

                <button
                  onClick={() => setSelectedAppt(appt)}
                  className="px-3.5 py-2 rounded-xl text-xs font-bold bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition-all flex items-center gap-1"
                >
                  <FileText className="w-3.5 h-3.5" />
                  <span>View Details</span>
                </button>

                {appt.status === 'CONFIRMED' && (
                  <>
                    <button
                      onClick={() => {
                        setSelectedAppt(appt);
                        setRescheduleDate(appt.date);
                        setIsRescheduling(true);
                      }}
                      className="p-2 rounded-xl text-slate-500 hover:text-slate-800 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                      title="Reschedule"
                    >
                      <RotateCcw className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => {
                        setSelectedAppt(appt);
                        setIsCancelling(true);
                      }}
                      className="p-2 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/50 transition-colors"
                      title="Cancel"
                    >
                      <XCircle className="w-4 h-4" />
                    </button>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Details Modal */}
      <Modal
        isOpen={Boolean(selectedAppt && !isRescheduling && !isCancelling)}
        onClose={() => setSelectedAppt(null)}
        title="Consultation Details & Care Plan"
        maxWidth="2xl"
      >
        {selectedAppt && (
          <div className="space-y-5">
            {/* Header info */}
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 flex flex-wrap items-center justify-between gap-3">
              <div>
                <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                  {selectedAppt.doctor.user.name} ({selectedAppt.doctor.specialisation})
                </h4>
                <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  {selectedAppt.date} • {selectedAppt.startTime} - {selectedAppt.endTime}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <StatusBadge status={selectedAppt.status} />
                <UrgencyBadge level={selectedAppt.urgencyLevel} size="sm" />
              </div>
            </div>

            {/* AI Pre-visit Section */}
            <div className="p-4 rounded-xl bg-teal-50/60 dark:bg-teal-950/30 border border-teal-200 dark:border-teal-900/50 space-y-2">
              <div className="flex items-center gap-1.5 text-xs font-bold uppercase text-teal-800 dark:text-teal-300">
                <Sparkles className="w-4 h-4" /> AI Pre-Visit Triage Briefing
              </div>
              <div className="text-xs text-slate-700 dark:text-slate-300">
                <strong>Symptoms Reported:</strong> "{selectedAppt.symptoms}"
              </div>
              {selectedAppt.chiefComplaint && (
                <div className="text-xs text-slate-700 dark:text-slate-300">
                  <strong>Chief Complaint:</strong> {selectedAppt.chiefComplaint}
                </div>
              )}
            </div>

            {/* Doctor Clinical Notes & Post-Visit Summary */}
            {selectedAppt.postVisitSummary ? (
              <div className="p-4 rounded-xl bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900/50 space-y-3">
                <div className="flex items-center gap-1.5 text-xs font-bold uppercase text-emerald-800 dark:text-emerald-300">
                  <CheckCircle2 className="w-4 h-4" /> Patient-Friendly Recovery Plan
                </div>
                <p className="text-xs text-slate-800 dark:text-slate-200 leading-relaxed">
                  {selectedAppt.postVisitSummary}
                </p>

                {selectedAppt.prescriptions && selectedAppt.prescriptions.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-emerald-200 dark:border-emerald-900/60 space-y-2">
                    <span className="text-xs font-bold text-emerald-900 dark:text-emerald-200 flex items-center gap-1">
                      <Pill className="w-3.5 h-3.5" /> Prescribed Medications:
                    </span>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {selectedAppt.prescriptions.map((rx) => (
                        <div key={rx.id} className="p-2.5 rounded-lg bg-white/80 dark:bg-slate-900/80 border border-emerald-100 dark:border-emerald-950 text-xs">
                          <div className="font-bold text-slate-900 dark:text-white">{rx.medicationName} ({rx.dosage})</div>
                          <div className="text-slate-500">{rx.frequency} • {rx.durationDays} days</div>
                          {rx.instructions && <div className="text-emerald-700 dark:text-emerald-300 text-[11px] mt-1">Note: {rx.instructions}</div>}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/40 text-center text-xs text-slate-400">
                Doctor consultation has not taken place yet. Post-visit summary and prescriptions will appear here once the visit is completed.
              </div>
            )}
          </div>
        )}
      </Modal>

      {/* Reschedule Modal */}
      <Modal
        isOpen={isRescheduling}
        onClose={() => setIsRescheduling(false)}
        title="Reschedule Appointment"
        maxWidth="md"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-bold uppercase text-slate-500 mb-1">New Date</label>
            <input
              type="date"
              min={new Date().toISOString().split('T')[0]}
              value={rescheduleDate}
              onChange={(e) => setRescheduleDate(e.target.value)}
              className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs text-slate-900 dark:text-white"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold uppercase text-slate-500 mb-1">Start Time</label>
              <input
                type="time"
                value={rescheduleStart}
                onChange={(e) => setRescheduleStart(e.target.value)}
                className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs text-slate-900 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase text-slate-500 mb-1">End Time</label>
              <input
                type="time"
                value={rescheduleEnd}
                onChange={(e) => setRescheduleEnd(e.target.value)}
                className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs text-slate-900 dark:text-white"
              />
            </div>
          </div>

          <button
            onClick={handleReschedule}
            className="w-full py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-xs font-bold transition-all"
          >
            Confirm Reschedule
          </button>
        </div>
      </Modal>

      {/* Cancel Modal */}
      <Modal
        isOpen={isCancelling}
        onClose={() => setIsCancelling(false)}
        title="Cancel Appointment"
        maxWidth="md"
      >
        <div className="space-y-4">
          <p className="text-xs text-slate-600 dark:text-slate-300">
            Are you sure you wish to cancel this appointment with Dr. {selectedAppt?.doctor.user.name}? This will free up the slot and release the Google Calendar event.
          </p>

          <div>
            <label className="block text-xs font-bold uppercase text-slate-500 mb-1">Reason for Cancellation</label>
            <input
              type="text"
              placeholder="e.g. Change of plans, recovered"
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
              className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs text-slate-900 dark:text-white"
            />
          </div>

          <button
            onClick={handleCancel}
            className="w-full py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition-all"
          >
            Confirm Cancellation
          </button>
        </div>
      </Modal>
    </div>
  );
};
