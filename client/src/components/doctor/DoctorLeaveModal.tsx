import React, { useState } from 'react';
import { leaveApi } from '../../services/api.js';
import { useToast } from '../../context/ToastContext.js';
import {
  Calendar,
  AlertTriangle,
  Send,
  Loader2,
  Users,
  CheckCircle2,
} from 'lucide-react';

interface DoctorLeaveModalProps {
  onSuccess: () => void;
}

export const DoctorLeaveModal: React.FC<DoctorLeaveModalProps> = ({ onSuccess }) => {
  const { success, error, warning } = useToast();

  const [startDate, setStartDate] = useState<string>(() => {
    const d = new Date(Date.now() + 24 * 60 * 60 * 1000);
    return d.toISOString().split('T')[0];
  });

  const [endDate, setEndDate] = useState<string>(() => {
    const d = new Date(Date.now() + 24 * 60 * 60 * 1000);
    return d.toISOString().split('T')[0];
  });

  const [reason, setReason] = useState<string>('Attending Medical Conference & Training');
  const [isPreviewing, setIsPreviewing] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [conflictPreview, setConflictPreview] = useState<{
    conflictCount: number;
    conflicts: any[];
  } | null>(null);

  const handleCheckConflicts = async () => {
    if (!startDate || !endDate) {
      error('Please select both start and end dates.');
      return;
    }

    try {
      setIsPreviewing(true);
      const res = await leaveApi.previewConflicts({ startDate, endDate });
      if (res.data.success) {
        setConflictPreview(res.data.preview);
        if (res.data.preview.conflictCount > 0) {
          warning(`Found ${res.data.preview.conflictCount} patient appointment(s) in this date range.`);
        } else {
          success('No booking conflicts found for these dates!');
        }
      }
    } catch (err: any) {
      error(err.response?.data?.message || 'Failed to check conflicts.');
    } finally {
      setIsPreviewing(false);
    }
  };

  const handleSubmitLeave = async () => {
    if (!startDate || !endDate || !reason.trim()) {
      error('Please fill all leave details.');
      return;
    }

    try {
      setIsSubmitting(true);
      const res = await leaveApi.applyLeave({
        startDate,
        endDate,
        reason: reason.trim(),
      });

      if (res.data.success) {
        success(
          `Leave recorded. ${res.data.affectedAppointmentsCount} patient(s) automatically notified via high-priority email.`
        );
        onSuccess();
      }
    } catch (err: any) {
      error(err.response?.data?.message || 'Failed to submit leave.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-5 text-xs">
      <p className="text-slate-600 dark:text-slate-300">
        Record your scheduled out-of-office dates. Any existing patient bookings will be automatically flagged for rescheduling, slots released, and affected patients alerted by email.
      </p>

      {/* Date Pickers */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block font-bold uppercase text-slate-500 mb-1">
            Start Date
          </label>
          <input
            type="date"
            min={new Date().toISOString().split('T')[0]}
            value={startDate}
            onChange={(e) => {
              setStartDate(e.target.value);
              setConflictPreview(null);
            }}
            className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
          />
        </div>

        <div>
          <label className="block font-bold uppercase text-slate-500 mb-1">
            End Date
          </label>
          <input
            type="date"
            min={startDate || new Date().toISOString().split('T')[0]}
            value={endDate}
            onChange={(e) => {
              setEndDate(e.target.value);
              setConflictPreview(null);
            }}
            className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
          />
        </div>
      </div>

      {/* Reason */}
      <div>
        <label className="block font-bold uppercase text-slate-500 mb-1">
          Reason for Leave
        </label>
        <input
          type="text"
          placeholder="e.g. Medical symposium, Personal leave, Annual vacation"
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
        />
      </div>

      {/* Check Conflicts Button */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          disabled={isPreviewing}
          onClick={handleCheckConflicts}
          className="px-4 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-bold hover:bg-slate-200 transition-all flex items-center gap-1.5"
        >
          {isPreviewing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Users className="w-3.5 h-3.5" />}
          <span>Check Affected Bookings</span>
        </button>
      </div>

      {/* Conflict Preview Box */}
      {conflictPreview && (
        <div
          className={`p-4 rounded-xl border space-y-2 ${
            conflictPreview.conflictCount > 0
              ? 'bg-rose-50/80 dark:bg-rose-950/40 border-rose-200 dark:border-rose-900 text-rose-900 dark:text-rose-200'
              : 'bg-emerald-50/80 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-900 text-emerald-900 dark:text-emerald-200'
          }`}
        >
          <div className="flex items-center gap-2 font-bold text-xs">
            {conflictPreview.conflictCount > 0 ? (
              <>
                <AlertTriangle className="w-4 h-4 text-rose-600" />
                <span>{conflictPreview.conflictCount} Confirmed Patient(s) Will Be Cancelled & Notified</span>
              </>
            ) : (
              <>
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>Zero Patient Conflicts Detected</span>
              </>
            )}
          </div>

          {conflictPreview.conflictCount > 0 && (
            <ul className="space-y-1 pt-1 text-[11px] max-h-32 overflow-y-auto">
              {conflictPreview.conflicts.map((c) => (
                <li key={c.id} className="flex items-center justify-between bg-white/70 dark:bg-slate-900/70 p-2 rounded">
                  <span>{c.patient?.name} ({c.patient?.email})</span>
                  <span className="font-semibold">{c.date} at {c.startTime}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {/* Submit Button */}
      <button
        type="button"
        disabled={isSubmitting || !startDate || !endDate}
        onClick={handleSubmitLeave}
        className="w-full py-3 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold flex items-center justify-center gap-2 shadow-md transition-all disabled:opacity-50"
      >
        {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
        <span>Confirm Leave & Auto-Notify Patients</span>
      </button>
    </div>
  );
};
