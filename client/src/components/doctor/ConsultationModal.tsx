import React, { useState } from 'react';
import { Appointment } from '../../types/index.js';
import { aiApi, appointmentApi } from '../../services/api.js';
import { useToast } from '../../context/ToastContext.js';
import {
  Stethoscope,
  Sparkles,
  Pill,
  Plus,
  Trash2,
  CheckCircle2,
  Loader2,
  FileText,
  AlertTriangle,
} from 'lucide-react';

interface ConsultationModalProps {
  appointment: Appointment;
  onSuccess: () => void;
}

export const ConsultationModal: React.FC<ConsultationModalProps> = ({
  appointment,
  onSuccess,
}) => {
  const { success, error } = useToast();

  const [clinicalNotes, setClinicalNotes] = useState<string>(
    appointment.clinicalNotes || ''
  );

  const [prescriptions, setPrescriptions] = useState<
    Array<{
      medicationName: string;
      dosage: string;
      frequency: string;
      durationDays: number;
      instructions: string;
    }>
  >(
    appointment.prescriptions?.map((p) => ({
      medicationName: p.medicationName,
      dosage: p.dosage,
      frequency: p.frequency,
      durationDays: p.durationDays,
      instructions: p.instructions || '',
    })) || [
      {
        medicationName: 'Amoxicillin',
        dosage: '500mg',
        frequency: 'Twice Daily after meals',
        durationDays: 7,
        instructions: 'Take with full glass of water. Complete full course.',
      },
    ]
  );

  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [aiPreview, setAiPreview] = useState<{
    friendlySummary: string;
    medicationSchedule: any[];
    followUpSteps: string[];
    warningsToWatch: string[];
  } | null>(
    appointment.postVisitSummary
      ? {
          friendlySummary: appointment.postVisitSummary,
          medicationSchedule: [],
          followUpSteps: appointment.followUpStepsArray || [],
          warningsToWatch: [],
        }
      : null
  );

  const handleAddMedicine = () => {
    setPrescriptions((prev) => [
      ...prev,
      {
        medicationName: '',
        dosage: '500mg',
        frequency: 'Twice Daily',
        durationDays: 5,
        instructions: '',
      },
    ]);
  };

  const handleRemoveMedicine = (idx: number) => {
    setPrescriptions((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleUpdateMedicine = (idx: number, field: string, value: any) => {
    setPrescriptions((prev) => {
      const copy = [...prev];
      (copy[idx] as any)[field] = value;
      return copy;
    });
  };

  const handlePreviewAI = async () => {
    if (!clinicalNotes.trim()) {
      error('Please write clinical notes before generating the AI care plan.');
      return;
    }

    try {
      setIsGenerating(true);
      const res = await aiApi.previewNotes(clinicalNotes.trim());
      if (res.data.success) {
        setAiPreview(res.data.carePlan);
        success('AI patient-friendly care plan generated!');
      }
    } catch (err: any) {
      error(err.response?.data?.message || 'Failed to generate AI care plan.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSubmit = async () => {
    if (!clinicalNotes.trim()) {
      error('Please enter clinical notes.');
      return;
    }

    try {
      setIsSaving(true);
      const validPrescriptions = prescriptions.filter((p) => p.medicationName.trim() !== '');

      const res = await appointmentApi.submitConsultation(appointment.id, {
        clinicalNotes: clinicalNotes.trim(),
        prescriptions: validPrescriptions,
      });

      if (res.data.success) {
        success('Consultation finalized & patient-friendly care plan saved!');
        onSuccess();
      }
    } catch (err: any) {
      error(err.response?.data?.message || 'Failed to submit consultation.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Patient Mini Banner */}
      <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div>
          <span className="text-slate-400">Patient:</span>
          <span className="font-bold text-slate-900 dark:text-white ml-1">
            {appointment.patient.name}
          </span>
          <span className="text-slate-400 ml-2">({appointment.patient.email})</span>
        </div>
        <div className="text-slate-500">
          Slot: {appointment.date} at {appointment.startTime}
        </div>
      </div>

      {/* Clinical Notes Editor */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
            <FileText className="w-4 h-4 text-teal-600" />
            Doctor Clinical Notes & Observations
          </label>
          <span className="text-[11px] text-slate-400">
            Will be transformed into plain English for the patient by AI
          </span>
        </div>

        <textarea
          rows={4}
          value={clinicalNotes}
          onChange={(e) => setClinicalNotes(e.target.value)}
          placeholder="e.g. Patient presents with upper respiratory viral infection. Lungs clear to auscultation. BP 120/80. Prescribing supportive care, Paracetamol for fever, and Azithromycin course..."
          className="w-full p-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-500 leading-relaxed"
        />
      </div>

      {/* Structured Prescription Builder */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <label className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
            <Pill className="w-4 h-4 text-brand-500" />
            Prescribed Medications & Reminder Schedule
          </label>

          <button
            type="button"
            onClick={handleAddMedicine}
            className="px-3 py-1.5 rounded-lg text-xs font-bold bg-teal-50 hover:bg-teal-100 dark:bg-teal-950 dark:hover:bg-teal-900 text-teal-700 dark:text-teal-300 border border-teal-200 dark:border-teal-800 flex items-center gap-1 transition-all"
          >
            <Plus className="w-3.5 h-3.5" /> Add Medicine
          </button>
        </div>

        <div className="space-y-2.5">
          {prescriptions.map((rx, idx) => (
            <div
              key={idx}
              className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 grid grid-cols-1 sm:grid-cols-12 gap-2.5 items-center text-xs"
            >
              <div className="sm:col-span-4">
                <input
                  type="text"
                  placeholder="Medicine Name (e.g. Amoxicillin)"
                  value={rx.medicationName}
                  onChange={(e) => handleUpdateMedicine(idx, 'medicationName', e.target.value)}
                  className="w-full p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-xs"
                />
              </div>

              <div className="sm:col-span-2">
                <input
                  type="text"
                  placeholder="Dosage (500mg)"
                  value={rx.dosage}
                  onChange={(e) => handleUpdateMedicine(idx, 'dosage', e.target.value)}
                  className="w-full p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-xs"
                />
              </div>

              <div className="sm:col-span-3">
                <input
                  type="text"
                  placeholder="Frequency (e.g. Twice Daily)"
                  value={rx.frequency}
                  onChange={(e) => handleUpdateMedicine(idx, 'frequency', e.target.value)}
                  className="w-full p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-xs"
                />
              </div>

              <div className="sm:col-span-2">
                <input
                  type="number"
                  placeholder="Days (e.g. 7)"
                  min={1}
                  max={90}
                  value={rx.durationDays}
                  onChange={(e) => handleUpdateMedicine(idx, 'durationDays', parseInt(e.target.value, 10))}
                  className="w-full p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-xs"
                />
              </div>

              <div className="sm:col-span-1 flex justify-end">
                <button
                  type="button"
                  onClick={() => handleRemoveMedicine(idx)}
                  className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Buttons */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
        <button
          type="button"
          disabled={isGenerating || !clinicalNotes.trim()}
          onClick={handlePreviewAI}
          className="w-full sm:w-auto px-4 py-2.5 rounded-xl border border-teal-300 dark:border-teal-700 bg-teal-50 hover:bg-teal-100 dark:bg-teal-950 dark:hover:bg-teal-900 text-teal-800 dark:text-teal-200 text-xs font-bold flex items-center justify-center gap-2 transition-all disabled:opacity-50"
        >
          {isGenerating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
          <span>Generate AI Patient Care Summary</span>
        </button>

        <button
          type="button"
          disabled={isSaving || !clinicalNotes.trim()}
          onClick={handleSubmit}
          className="w-full sm:w-auto px-6 py-3 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold flex items-center justify-center gap-2 shadow-lg shadow-teal-600/30 transition-all disabled:opacity-50"
        >
          {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
          <span>Complete Visit & Deliver Care Plan</span>
        </button>
      </div>

      {/* AI Post-Visit Care Plan Preview Card */}
      {aiPreview && (
        <div className="p-5 rounded-2xl bg-gradient-to-br from-teal-50 to-emerald-50 dark:from-slate-800 dark:to-slate-900 border border-teal-200 dark:border-teal-900/50 space-y-4">
          <div className="flex items-center gap-2 text-teal-800 dark:text-teal-200">
            <Sparkles className="w-5 h-5 text-teal-600 dark:text-teal-400" />
            <h4 className="text-xs font-bold uppercase tracking-wider">
              Patient-Friendly Summary Preview (AI Generated)
            </h4>
          </div>

          <p className="text-xs text-slate-800 dark:text-slate-200 leading-relaxed bg-white/70 dark:bg-slate-900/70 p-3.5 rounded-xl border border-teal-100 dark:border-teal-950">
            {aiPreview.friendlySummary}
          </p>

          {aiPreview.followUpSteps && aiPreview.followUpSteps.length > 0 && (
            <div>
              <span className="text-[11px] font-bold uppercase text-slate-400">
                Follow-Up Steps & Recovery Guidance:
              </span>
              <ul className="mt-1.5 space-y-1 text-xs text-slate-700 dark:text-slate-300 list-disc list-inside">
                {aiPreview.followUpSteps.map((step, sIdx) => (
                  <li key={sIdx}>{step}</li>
                ))}
              </ul>
            </div>
          )}

          {aiPreview.warningsToWatch && aiPreview.warningsToWatch.length > 0 && (
            <div className="p-3 rounded-xl bg-amber-50/80 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900 text-xs text-amber-900 dark:text-amber-200 space-y-1">
              <span className="font-bold flex items-center gap-1">
                <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                Symptoms To Watch:
              </span>
              <ul className="list-disc list-inside space-y-0.5 text-[11px]">
                {aiPreview.warningsToWatch.map((w, wIdx) => (
                  <li key={wIdx}>{w}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
