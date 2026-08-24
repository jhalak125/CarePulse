import React, { useState } from 'react';
import { SlotHold, Appointment } from '../../types/index.js';
import { aiApi, appointmentApi } from '../../services/api.js';
import { useToast } from '../../context/ToastContext.js';
import { UrgencyBadge } from '../common/Badge.js';
import {
  Sparkles,
  CheckCircle2,
  Calendar,
  Clock,
  Video,
  FileText,
  HelpCircle,
  ArrowLeft,
  Loader2,
} from 'lucide-react';

interface SymptomFormProps {
  hold: SlotHold;
  onBack: () => void;
  onBookingSuccess: (appointment: Appointment) => void;
}

export const SymptomForm: React.FC<SymptomFormProps> = ({
  hold,
  onBack,
  onBookingSuccess,
}) => {
  const { success, error } = useToast();
  const [symptoms, setSymptoms] = useState<string>('');
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [aiPreview, setAiPreview] = useState<{
    urgencyLevel: 'LOW' | 'MEDIUM' | 'HIGH';
    chiefComplaint: string;
    suggestedQuestions: string[];
    summary: string;
  } | null>(null);

  const sampleSymptoms = [
    'Experiencing persistent dull headache for 3 days with mild sensitivity to light and nausea.',
    'Sharp chest tightness on left side during morning jogs, accompanied by mild dizziness and sweating.',
    'Red itchy expanding skin rash on forearms after contact with outdoor weeds.',
  ];

  const handleTestAiTriage = async () => {
    if (!symptoms.trim()) {
      error('Please write down your symptoms first.');
      return;
    }
    try {
      setIsAnalyzing(true);
      const res = await aiApi.previewSymptoms(symptoms.trim());
      if (res.data.success) {
        setAiPreview(res.data.analysis);
        success('AI Pre-visit Triage summary generated!');
      }
    } catch (err: any) {
      error(err.response?.data?.message || 'Failed to analyze symptoms.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleConfirm = async () => {
    if (!symptoms.trim()) {
      error('Please describe your symptoms before confirming.');
      return;
    }

    try {
      setIsSubmitting(true);
      const res = await appointmentApi.confirmBooking({
        holdId: hold.holdId,
        symptoms: symptoms.trim(),
      });

      if (res.data.success) {
        success('Appointment successfully confirmed!');
        onBookingSuccess(res.data.appointment);
      }
    } catch (err: any) {
      error(err.response?.data?.message || 'Booking failed. Your reservation may have expired.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="glass-card rounded-2xl p-6 space-y-6 max-w-3xl mx-auto">
      {/* Back button and Header */}
      <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
        <button
          onClick={onBack}
          className="flex items-center gap-1 text-xs font-semibold text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Slots
        </button>
        <span className="text-xs font-bold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/60 px-3 py-1 rounded-full border border-amber-300 dark:border-amber-700">
          Slot Held: {hold.startTime} - {hold.endTime}
        </span>
      </div>

      {/* Booking Summary Pill */}
      <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 flex flex-wrap items-center justify-between gap-4 text-xs">
        <div>
          <span className="text-slate-400 font-medium">Doctor:</span>
          <div className="font-bold text-slate-900 dark:text-white text-sm">
            {hold.doctorName}
          </div>
          <span className="text-brand-600 dark:text-brand-400 font-semibold">
            {hold.specialisation}
          </span>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5 text-slate-700 dark:text-slate-200">
            <Calendar className="w-4 h-4 text-brand-500" />
            <span className="font-semibold">{hold.date}</span>
          </div>
          <div className="flex items-center gap-1.5 text-slate-700 dark:text-slate-200">
            <Clock className="w-4 h-4 text-brand-500" />
            <span className="font-semibold">{hold.startTime} - {hold.endTime}</span>
          </div>
        </div>
      </div>

      {/* Symptom Input Form */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <label className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
            <FileText className="w-4 h-4 text-brand-500" />
            Describe Your Symptoms & Health Concerns
          </label>
          <span className="text-[11px] text-slate-400">
            Shared with Dr. {hold.doctorName.split(' ')[1] || hold.doctorName} in advance
          </span>
        </div>

        <textarea
          rows={4}
          value={symptoms}
          onChange={(e) => setSymptoms(e.target.value)}
          placeholder="e.g. When did it start? Severity? Any current medications or relevant medical history?"
          className="w-full p-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 text-slate-900 dark:text-white"
        />

        {/* Quick Sample Prompts */}
        <div className="flex flex-wrap items-center gap-2 pt-1">
          <span className="text-[11px] text-slate-400 font-medium">Try sample:</span>
          {sampleSymptoms.map((sample, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => setSymptoms(sample)}
              className="text-[11px] px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-brand-50 dark:bg-slate-800 dark:hover:bg-brand-950/40 text-slate-600 dark:text-slate-300 hover:text-brand-600 border border-slate-200 dark:border-slate-700 transition-all text-left"
            >
              Example {idx + 1}
            </button>
          ))}
        </div>
      </div>

      {/* Real-time AI Triage Preview Button */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
        <button
          type="button"
          disabled={isAnalyzing || !symptoms.trim()}
          onClick={handleTestAiTriage}
          className="w-full sm:w-auto px-4 py-2.5 rounded-xl border border-teal-300 dark:border-teal-700 bg-teal-50 hover:bg-teal-100 dark:bg-teal-950/50 dark:hover:bg-teal-900/50 text-teal-800 dark:text-teal-200 text-xs font-bold flex items-center justify-center gap-2 transition-all disabled:opacity-50"
        >
          {isAnalyzing ? (
            <Loader2 className="w-4 h-4 animate-spin text-teal-600" />
          ) : (
            <Sparkles className="w-4 h-4 text-teal-600 dark:text-teal-400" />
          )}
          <span>Preview AI Clinical Triage & Urgency</span>
        </button>

        <button
          type="button"
          disabled={isSubmitting || !symptoms.trim()}
          onClick={handleConfirm}
          className="w-full sm:w-auto px-6 py-3 rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-xs font-bold flex items-center justify-center gap-2 shadow-lg shadow-brand-600/30 transition-all disabled:opacity-50"
        >
          {isSubmitting ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <CheckCircle2 className="w-4 h-4" />
          )}
          <span>Confirm & Schedule Visit</span>
        </button>
      </div>

      {/* Live AI Pre-visit Triage Preview Card */}
      {aiPreview && (
        <div className="p-5 rounded-2xl bg-gradient-to-br from-teal-50/70 to-emerald-50/70 dark:from-slate-800/80 dark:to-slate-900/80 border border-teal-200 dark:border-teal-900/50 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-teal-600 dark:text-teal-400" />
              <h4 className="text-xs font-bold uppercase tracking-wider text-teal-900 dark:text-teal-200">
                AI Pre-Visit Clinical Analysis
              </h4>
            </div>
            <UrgencyBadge level={aiPreview.urgencyLevel} size="md" />
          </div>

          <div>
            <span className="text-[11px] font-semibold text-slate-400 uppercase">Chief Complaint:</span>
            <p className="text-sm font-bold text-slate-800 dark:text-slate-100 mt-0.5">
              {aiPreview.chiefComplaint}
            </p>
          </div>

          <div>
            <span className="text-[11px] font-semibold text-slate-400 uppercase flex items-center gap-1">
              <HelpCircle className="w-3.5 h-3.5 text-teal-500" />
              3 Suggested Clinical Questions For Doctor:
            </span>
            <ul className="mt-1.5 space-y-1.5 text-xs text-slate-700 dark:text-slate-300">
              {aiPreview.suggestedQuestions.map((q, idx) => (
                <li key={idx} className="flex items-start gap-2 bg-white/70 dark:bg-slate-800/60 p-2 rounded-lg border border-teal-100 dark:border-teal-950">
                  <span className="font-bold text-teal-600">{idx + 1}.</span>
                  <span>{q}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
};
