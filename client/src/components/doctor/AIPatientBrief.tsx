import React from 'react';
import { Appointment } from '../../types/index.js';
import { UrgencyBadge } from '../common/Badge.js';
import { Sparkles, HelpCircle, FileText, User, Calendar, Clock } from 'lucide-react';

interface AIPatientBriefProps {
  appointment: Appointment;
}

export const AIPatientBrief: React.FC<AIPatientBriefProps> = ({ appointment }) => {
  let questions: string[] = [];
  try {
    if (appointment.suggestedQuestions) {
      questions = JSON.parse(appointment.suggestedQuestions);
    } else if (appointment.suggestedQuestionsArray) {
      questions = appointment.suggestedQuestionsArray;
    }
  } catch (_) {
    questions = [];
  }

  return (
    <div className="space-y-5">
      {/* Patient Header Box */}
      <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-teal-500/10 text-teal-600 flex items-center justify-center font-bold">
            <User className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-slate-900 dark:text-white">
              {appointment.patient.name}
            </h4>
            <div className="text-xs text-slate-400">
              {appointment.patient.email} {appointment.patient.phone && `• ${appointment.patient.phone}`}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="text-xs text-slate-500 font-medium">
            {appointment.date} ({appointment.startTime} - {appointment.endTime})
          </div>
          <UrgencyBadge level={appointment.urgencyLevel} size="md" />
        </div>
      </div>

      {/* Reported Symptoms */}
      <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-2">
        <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-400">
          <FileText className="w-4 h-4 text-brand-500" />
          Patient Reported Symptoms (Intake Form)
        </div>
        <p className="text-xs text-slate-800 dark:text-slate-200 italic leading-relaxed">
          "{appointment.symptoms}"
        </p>
      </div>

      {/* AI Pre-visit Triage Summary */}
      <div className="p-5 rounded-2xl bg-gradient-to-br from-teal-50 to-emerald-50 dark:from-slate-800 dark:to-slate-900 border border-teal-200 dark:border-teal-900/50 space-y-4">
        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-teal-600 dark:text-teal-400" />
          <h4 className="text-xs font-bold uppercase tracking-wider text-teal-900 dark:text-teal-200">
            LLM Clinical Triage Briefing
          </h4>
        </div>

        <div>
          <span className="text-[11px] font-semibold uppercase text-slate-400">
            Assessed Chief Complaint:
          </span>
          <p className="text-sm font-bold text-slate-900 dark:text-slate-100 mt-0.5">
            {appointment.chiefComplaint || 'General medical consultation requested.'}
          </p>
        </div>

        {/* 3 Suggested Questions */}
        <div className="space-y-2 pt-2 border-t border-teal-200/60 dark:border-teal-900/60">
          <span className="text-[11px] font-bold uppercase text-teal-900 dark:text-teal-200 flex items-center gap-1.5">
            <HelpCircle className="w-4 h-4 text-teal-600 dark:text-teal-400" />
            3 Suggested Questions For Clinical History Taking:
          </span>

          <ul className="space-y-2 mt-2">
            {questions.map((q, idx) => (
              <li
                key={idx}
                className="p-3 rounded-xl bg-white/80 dark:bg-slate-900/80 border border-teal-100 dark:border-teal-950 text-xs text-slate-800 dark:text-slate-200 flex items-start gap-2.5 shadow-sm"
              >
                <span className="font-bold text-teal-600 dark:text-teal-400 bg-teal-50 dark:bg-teal-950 px-2 py-0.5 rounded">
                  Q{idx + 1}
                </span>
                <span className="leading-relaxed">{q}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
};
