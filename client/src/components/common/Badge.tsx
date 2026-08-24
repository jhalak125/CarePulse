import React from 'react';
import { AlertCircle, AlertTriangle, CheckCircle, Clock } from 'lucide-react';
import { UrgencyLevel, AppointmentStatus } from '../../types/index.js';

export const UrgencyBadge: React.FC<{ level: UrgencyLevel; size?: 'sm' | 'md' | 'lg' }> = ({
  level,
  size = 'md',
}) => {
  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5 gap-1',
    md: 'text-xs px-2.5 py-1 gap-1.5 font-semibold',
    lg: 'text-sm px-3.5 py-1.5 gap-2 font-bold',
  };

  if (level === 'HIGH') {
    return (
      <span
        className={`inline-flex items-center rounded-full bg-rose-100 dark:bg-rose-950/80 text-rose-700 dark:text-rose-300 border border-rose-300 dark:border-rose-800 ${sizeClasses[size]}`}
      >
        <span className="w-2 h-2 rounded-full bg-rose-600 animate-ping" />
        <AlertCircle className="w-3.5 h-3.5" />
        <span>HIGH URGENCY</span>
      </span>
    );
  }

  if (level === 'MEDIUM') {
    return (
      <span
        className={`inline-flex items-center rounded-full bg-amber-100 dark:bg-amber-950/80 text-amber-700 dark:text-amber-300 border border-amber-300 dark:border-amber-800 ${sizeClasses[size]}`}
      >
        <AlertTriangle className="w-3.5 h-3.5" />
        <span>MEDIUM URGENCY</span>
      </span>
    );
  }

  return (
    <span
      className={`inline-flex items-center rounded-full bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800 ${sizeClasses[size]}`}
    >
      <CheckCircle className="w-3.5 h-3.5" />
      <span>LOW URGENCY</span>
    </span>
  );
};

export const StatusBadge: React.FC<{ status: AppointmentStatus | string }> = ({ status }) => {
  switch (status) {
    case 'CONFIRMED':
      return (
        <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full bg-teal-100 text-teal-800 dark:bg-teal-950 dark:text-teal-300 border border-teal-300 dark:border-teal-800">
          <Clock className="w-3 h-3" /> Confirmed
        </span>
      );
    case 'COMPLETED':
      return (
        <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">
          <CheckCircle className="w-3 h-3" /> Completed
        </span>
      );
    case 'CANCELLED_DOCTOR_LEAVE':
      return (
        <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 border border-amber-300 dark:border-amber-800">
          ⚠️ Doctor Leave
        </span>
      );
    case 'CANCELLED_BY_PATIENT':
    case 'CANCELLED':
      return (
        <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300 border border-rose-300 dark:border-rose-800">
          Cancelled
        </span>
      );
    case 'RESCHEDULED':
      return (
        <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300 border border-blue-300 dark:border-blue-800">
          Rescheduled
        </span>
      );
    default:
      return (
        <span className="inline-flex items-center text-xs font-medium px-2.5 py-1 rounded-full bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-300">
          {status}
        </span>
      );
  }
};
