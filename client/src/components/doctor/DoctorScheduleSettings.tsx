import React, { useState } from 'react';
import { DoctorProfile } from '../../types/index.js';
import { doctorApi } from '../../services/api.js';
import { useToast } from '../../context/ToastContext.js';
import { Clock, DollarSign, Calendar, Save, Loader2 } from 'lucide-react';

interface DoctorScheduleSettingsProps {
  doctor: DoctorProfile;
  onUpdate: () => void;
}

export const DoctorScheduleSettings: React.FC<DoctorScheduleSettingsProps> = ({
  doctor,
  onUpdate,
}) => {
  const { success, error } = useToast();

  const [workingStart, setWorkingStart] = useState<string>(doctor.workingHoursStart || '09:00');
  const [workingEnd, setWorkingEnd] = useState<string>(doctor.workingHoursEnd || '17:00');
  const [breakStart, setBreakStart] = useState<string>(doctor.breakStart || '13:00');
  const [breakEnd, setBreakEnd] = useState<string>(doctor.breakEnd || '14:00');
  const [slotDuration, setSlotDuration] = useState<number>(doctor.slotDurationMinutes || 30);
  const [fee, setFee] = useState<number>(doctor.consultationFee || 75);
  const [workingDays, setWorkingDays] = useState<string>(doctor.workingDays || 'Monday,Tuesday,Wednesday,Thursday,Friday');
  const [isSaving, setIsSaving] = useState<boolean>(false);

  const daysList = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

  const toggleDay = (day: string) => {
    const current = workingDays.split(',').map((d) => d.trim());
    if (current.includes(day)) {
      setWorkingDays(current.filter((d) => d !== day).join(','));
    } else {
      setWorkingDays([...current, day].join(','));
    }
  };

  const handleSave = async () => {
    try {
      setIsSaving(true);
      const res = await doctorApi.updateProfile(doctor.id, {
        workingHoursStart: workingStart,
        workingHoursEnd: workingEnd,
        breakStart: breakStart || null,
        breakEnd: breakEnd || null,
        slotDurationMinutes: slotDuration,
        consultationFee: fee,
        workingDays,
      });

      if (res.data.success) {
        success('Doctor clinic schedule and slot configurations updated.');
        onUpdate();
      }
    } catch (err: any) {
      error(err.response?.data?.message || 'Failed to update schedule.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="glass-card rounded-2xl p-6 space-y-6 text-xs">
      <div>
        <h4 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <Clock className="w-4 h-4 text-teal-500" />
          Clinic Hours & Slot Timing Configuration
        </h4>
        <p className="text-slate-500 dark:text-slate-400 mt-0.5">
          Controls how discrete appointment slots are dynamically generated on your booking calendar.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
        <div>
          <label className="block font-bold uppercase text-slate-500 mb-1">
            Clinic Start Time
          </label>
          <input
            type="time"
            value={workingStart}
            onChange={(e) => setWorkingStart(e.target.value)}
            className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
          />
        </div>

        <div>
          <label className="block font-bold uppercase text-slate-500 mb-1">
            Clinic End Time
          </label>
          <input
            type="time"
            value={workingEnd}
            onChange={(e) => setWorkingEnd(e.target.value)}
            className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
          />
        </div>

        <div>
          <label className="block font-bold uppercase text-slate-500 mb-1">
            Break Window Start
          </label>
          <input
            type="time"
            value={breakStart}
            onChange={(e) => setBreakStart(e.target.value)}
            className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
          />
        </div>

        <div>
          <label className="block font-bold uppercase text-slate-500 mb-1">
            Break Window End
          </label>
          <input
            type="time"
            value={breakEnd}
            onChange={(e) => setBreakEnd(e.target.value)}
            className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
        <div>
          <label className="block font-bold uppercase text-slate-500 mb-1">
            Slot Duration (Minutes)
          </label>
          <select
            value={slotDuration}
            onChange={(e) => setSlotDuration(parseInt(e.target.value, 10))}
            className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-bold"
          >
            <option value={15}>15 Minutes</option>
            <option value={20}>20 Minutes</option>
            <option value={30}>30 Minutes (Recommended)</option>
            <option value={45}>45 Minutes</option>
            <option value={60}>60 Minutes</option>
          </select>
        </div>

        <div>
          <label className="block font-bold uppercase text-slate-500 mb-1">
            Consultation Fee (₹ INR)
          </label>
          <div className="relative">
            <DollarSign className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="number"
              min={0}
              value={fee}
              onChange={(e) => setFee(parseFloat(e.target.value))}
              className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-bold"
            />
          </div>
        </div>
      </div>

      {/* Working Days Selector */}
      <div className="space-y-2 pt-2">
        <label className="block font-bold uppercase text-slate-500">
          Active Working Days
        </label>
        <div className="flex flex-wrap gap-2">
          {daysList.map((day) => {
            const isSelected = workingDays.toLowerCase().includes(day.toLowerCase());
            return (
              <button
                key={day}
                type="button"
                onClick={() => toggleDay(day)}
                className={`px-3 py-1.5 rounded-xl font-bold transition-all ${
                  isSelected
                    ? 'bg-teal-600 text-white shadow-sm'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:bg-slate-200'
                }`}
              >
                {day}
              </button>
            );
          })}
        </div>
      </div>

      <button
        onClick={handleSave}
        disabled={isSaving}
        className="px-6 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold flex items-center gap-2 shadow-md transition-all disabled:opacity-50"
      >
        {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
        <span>Save Schedule Settings</span>
      </button>
    </div>
  );
};
