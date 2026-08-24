import React, { useState, useEffect } from 'react';
import { DoctorProfile, Slot, SlotHold } from '../../types/index.js';
import { doctorApi, appointmentApi } from '../../services/api.js';
import { useToast } from '../../context/ToastContext.js';
import { Calendar, Clock, Lock, ShieldAlert, Timer, ArrowRight } from 'lucide-react';

interface SlotPickerProps {
  doctor: DoctorProfile;
  onSlotHeld: (hold: SlotHold) => void;
  onCancel: () => void;
}

export const SlotPicker: React.FC<SlotPickerProps> = ({
  doctor,
  onSlotHeld,
  onCancel,
}) => {
  const { success, error, warning } = useToast();
  
  // Format today's date YYYY-MM-DD
  const [selectedDate, setSelectedDate] = useState<string>(() => {
    const d = new Date();
    return d.toISOString().split('T')[0];
  });

  const [slots, setSlots] = useState<Slot[]>([]);
  const [loadingSlots, setLoadingSlots] = useState<boolean>(true);
  const [isOnLeave, setIsOnLeave] = useState<boolean>(false);
  const [leaveReason, setLeaveReason] = useState<string>('');
  const [activeHold, setActiveHold] = useState<SlotHold | null>(null);
  const [holdingSlotTime, setHoldingSlotTime] = useState<string | null>(null);
  const [secondsRemaining, setSecondsRemaining] = useState<number>(600);

  // Fetch availability when date changes
  useEffect(() => {
    fetchSlots();
  }, [selectedDate, doctor.id]);

  // Countdown timer for active hold
  useEffect(() => {
    if (!activeHold) return;

    const interval = setInterval(() => {
      const expires = new Date(activeHold.expiresAt).getTime();
      const diff = Math.max(0, Math.floor((expires - Date.now()) / 1000));
      setSecondsRemaining(diff);

      if (diff === 0) {
        setActiveHold(null);
        setHoldingSlotTime(null);
        warning('Your 10-minute slot hold has expired. Please choose a slot to re-reserve.');
        fetchSlots();
        clearInterval(interval);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [activeHold]);

  const fetchSlots = async () => {
    try {
      setLoadingSlots(true);
      const res = await doctorApi.getAvailability(doctor.id, selectedDate);
      if (res.data.success) {
        setIsOnLeave(res.data.isOnLeave);
        setLeaveReason(res.data.leaveReason || '');
        setSlots(res.data.slots || []);
      }
    } catch (err: any) {
      error(err.response?.data?.message || 'Failed to fetch doctor availability.');
    } finally {
      setLoadingSlots(false);
    }
  };

  const handleHoldSlot = async (slot: Slot) => {
    if (!slot.isAvailable) return;

    try {
      setHoldingSlotTime(slot.startTime);
      const res = await appointmentApi.holdSlot({
        doctorId: doctor.id,
        date: selectedDate,
        startTime: slot.startTime,
        endTime: slot.endTime,
      });

      if (res.data.success) {
        setActiveHold(res.data.hold);
        setSecondsRemaining(res.data.hold.holdMinutes * 60);
        success(`Slot ${slot.startTime} held for 10 minutes!`);
        fetchSlots();
      }
    } catch (err: any) {
      error(err.response?.data?.message || 'Failed to hold slot. It may have just been booked.');
      fetchSlots();
    } finally {
      setHoldingSlotTime(null);
    }
  };

  const formatTimer = (totalSecs: number) => {
    const mins = Math.floor(totalSecs / 60);
    const secs = totalSecs % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  return (
    <div className="glass-card rounded-2xl p-6 space-y-6">
      {/* Header Info */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-800">
        <div className="flex items-center gap-3">
          <img
            src={
              doctor.user.avatarUrl ||
              'https://images.unsplash.com/photo-1622253692010-333f2da6031d?w=150&auto=format&fit=crop&q=80'
            }
            alt={doctor.user.name}
            className="w-12 h-12 rounded-xl object-cover border border-slate-200 dark:border-slate-700 shadow-sm"
          />
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              {doctor.user.name}
            </h3>
            <span className="text-xs font-semibold text-brand-600 dark:text-brand-400">
              {doctor.specialisation} • ₹{doctor.consultationFee} / {doctor.slotDurationMinutes} min session
            </span>
          </div>
        </div>

        <button
          onClick={onCancel}
          className="text-xs font-semibold text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 self-start sm:self-center"
        >
          Change Doctor
        </button>
      </div>

      {/* Active Hold Countdown Banner */}
      {activeHold && (
        <div className="p-4 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-700 flex flex-col sm:flex-row sm:items-center justify-between gap-3 timer-glow">
          <div className="flex items-center gap-2.5">
            <Timer className="w-5 h-5 text-amber-600 dark:text-amber-400 animate-spin" style={{ animationDuration: '6s' }} />
            <div>
              <div className="text-xs font-bold text-amber-900 dark:text-amber-200">
                Slot Reserved: {activeHold.date} at {activeHold.startTime} - {activeHold.endTime}
              </div>
              <div className="text-[11px] text-amber-700 dark:text-amber-300">
                Locked exclusively for you. Please proceed to describe your symptoms.
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="text-sm font-mono font-extrabold text-amber-900 dark:text-amber-100 bg-amber-200 dark:bg-amber-900 px-3 py-1 rounded-lg">
              {formatTimer(secondsRemaining)}
            </div>
            <button
              onClick={() => onSlotHeld(activeHold)}
              className="px-4 py-1.5 rounded-lg text-xs font-bold bg-brand-600 hover:bg-brand-700 text-white shadow-sm flex items-center gap-1 transition-all"
            >
              <span>Next: Symptoms</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* Date Picker Input */}
      <div>
        <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
          Select Consultation Date
        </label>
        <div className="relative max-w-xs">
          <Calendar className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="date"
            min={new Date().toISOString().split('T')[0]}
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 text-slate-900 dark:text-white"
          />
        </div>
      </div>

      {/* Doctor Leave Warning */}
      {isOnLeave ? (
        <div className="p-6 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-center space-y-2">
          <ShieldAlert className="w-10 h-10 text-rose-500 mx-auto" />
          <h4 className="text-sm font-bold text-rose-900 dark:text-rose-200">
            Doctor On Approved Leave
          </h4>
          <p className="text-xs text-rose-700 dark:text-rose-300 max-w-md mx-auto">
            {doctor.user.name} is on leave on {selectedDate} ({leaveReason || 'Scheduled Out-of-Office'}). Please select another available date.
          </p>
        </div>
      ) : loadingSlots ? (
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3 animate-pulse">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="h-14 rounded-xl bg-slate-100 dark:bg-slate-800" />
          ))}
        </div>
      ) : slots.length === 0 ? (
        <div className="text-center py-8 text-slate-500 text-xs">
          No clinic hours available on this date. Please pick a working day ({doctor.workingDays}).
        </div>
      ) : (
        <div>
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
              Available Time Slots ({slots.length} total)
            </span>
            <div className="flex items-center gap-3 text-[11px] text-slate-400">
              <span className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" /> Available
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500" /> Held
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded-full bg-slate-400" /> Booked
              </span>
            </div>
          </div>

          {/* Slot Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
            {slots.map((slot) => {
              const isHeld = slot.status === 'HELD_BY_YOU';
              const isOtherHold = slot.status === 'HELD_BY_OTHER';
              const isBooked = slot.status === 'BOOKED';
              const isPending = holdingSlotTime === slot.startTime;

              return (
                <button
                  key={slot.startTime}
                  disabled={!slot.isAvailable || isPending}
                  onClick={() => handleHoldSlot(slot)}
                  className={`p-3 rounded-xl border text-center relative transition-all flex flex-col items-center justify-center gap-1 ${
                    isHeld
                      ? 'bg-amber-50 dark:bg-amber-950/60 border-amber-400 text-amber-900 dark:text-amber-100 ring-2 ring-amber-400/50'
                      : isOtherHold
                      ? 'bg-slate-100 dark:bg-slate-800/40 border-slate-200 dark:border-slate-800 text-slate-400 cursor-not-allowed'
                      : isBooked
                      ? 'bg-slate-100 dark:bg-slate-800/40 border-slate-200 dark:border-slate-800 text-slate-400 cursor-not-allowed opacity-60'
                      : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-brand-500 hover:bg-brand-50/50 dark:hover:bg-brand-950/30 text-slate-800 dark:text-slate-100 shadow-sm'
                  }`}
                >
                  <span className="text-xs font-bold flex items-center gap-1">
                    <Clock className="w-3 h-3 text-slate-400" />
                    {slot.startTime}
                  </span>
                  <span className="text-[10px] text-slate-400">
                    {slot.endTime}
                  </span>

                  {/* Status Indicator */}
                  {isHeld ? (
                    <span className="text-[9px] font-bold text-amber-600 dark:text-amber-400 uppercase tracking-tight">
                      Held by You
                    </span>
                  ) : isOtherHold ? (
                    <span className="text-[9px] font-semibold text-slate-400 flex items-center gap-0.5">
                      <Lock className="w-2.5 h-2.5" /> Held
                    </span>
                  ) : isBooked ? (
                    <span className="text-[9px] font-semibold text-slate-400">Booked</span>
                  ) : (
                    <span className="text-[9px] font-bold text-brand-600 dark:text-brand-400">
                      Reserve
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
