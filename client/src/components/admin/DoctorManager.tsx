import React, { useState, useEffect } from 'react';
import { DoctorProfile } from '../../types/index.js';
import { doctorApi, adminApi } from '../../services/api.js';
import { useToast } from '../../context/ToastContext.js';
import { Modal } from '../common/Modal.js';
import {
  Stethoscope,
  Plus,
  Clock,
  DollarSign,
  Award,
  Loader2,
  CheckCircle2,
} from 'lucide-react';

export const DoctorManager: React.FC = () => {
  const { success, error } = useToast();
  const [doctors, setDoctors] = useState<DoctorProfile[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [isAddOpen, setIsAddOpen] = useState<boolean>(false);

  // New Doctor form
  const [name, setName] = useState<string>('');
  const [email, setEmail] = useState<string>('');
  const [specialisation, setSpecialisation] = useState<string>('Cardiology');
  const [fee, setFee] = useState<number>(85);
  const [slotDuration, setSlotDuration] = useState<number>(30);
  const [experienceYears, setExperienceYears] = useState<number>(8);
  const [workingStart, setWorkingStart] = useState<string>('09:00');
  const [workingEnd, setWorkingEnd] = useState<string>('17:00');
  const [bio, setBio] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  useEffect(() => {
    fetchDoctors();
  }, []);

  const fetchDoctors = async () => {
    try {
      setLoading(true);
      const res = await doctorApi.getDoctors();
      if (res.data.success) {
        setDoctors(res.data.doctors);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateDoctor = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email || !specialisation) {
      error('Name, email, and specialisation are required.');
      return;
    }

    try {
      setIsSubmitting(true);
      const res = await adminApi.createDoctor({
        name,
        email,
        specialisation,
        consultationFee: fee,
        slotDurationMinutes: slotDuration,
        experienceYears,
        workingHoursStart: workingStart,
        workingHoursEnd: workingEnd,
        bio,
      });

      if (res.data.success) {
        success(`Doctor profile created for Dr. ${name}!`);
        setIsAddOpen(false);
        setName('');
        setEmail('');
        setBio('');
        fetchDoctors();
      }
    } catch (err: any) {
      error(err.response?.data?.message || 'Failed to create doctor profile.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Stethoscope className="w-5 h-5 text-indigo-500" />
            Clinic Specialist Roster ({doctors.length} Doctors)
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Configure working hours, specialisations, and slot durations.
          </p>
        </div>

        <button
          onClick={() => setIsAddOpen(true)}
          className="px-4 py-2.5 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white shadow-md shadow-indigo-600/30 flex items-center gap-1.5 transition-all self-start sm:self-center"
        >
          <Plus className="w-4 h-4" /> Add Specialist Profile
        </button>
      </div>

      {/* Doctors Table */}
      {loading ? (
        <div className="space-y-3 animate-pulse">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-20 glass-card rounded-2xl" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {doctors.map((doc) => (
            <div key={doc.id} className="glass-card rounded-2xl p-5 space-y-4">
              <div className="flex items-start gap-3.5">
                <img
                  src={
                    doc.user.avatarUrl ||
                    'https://images.unsplash.com/photo-1622253692010-333f2da6031d?w=150&auto=format&fit=crop&q=80'
                  }
                  alt={doc.user.name}
                  className="w-12 h-12 rounded-xl object-cover border border-slate-200 dark:border-slate-800"
                />
                <div className="flex-1 min-w-0">
                  <span className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/80 px-2 py-0.5 rounded uppercase">
                    {doc.specialisation}
                  </span>
                  <h4 className="text-sm font-bold text-slate-900 dark:text-white mt-1 truncate">
                    {doc.user.name}
                  </h4>
                  <div className="text-xs text-slate-400 truncate">{doc.user.email}</div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 pt-3 border-t border-slate-100 dark:border-slate-800 text-xs text-slate-500">
                <div className="flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-slate-400" />
                  <span>{doc.workingHoursStart} - {doc.workingHoursEnd}</span>
                </div>
                <div className="flex items-center gap-1 justify-end">
                  <DollarSign className="w-3.5 h-3.5 text-slate-400" />
                  <span className="font-bold text-slate-900 dark:text-white">₹{doc.consultationFee}</span>
                  <span>/ {doc.slotDurationMinutes}m</span>
                </div>
              </div>

              <div className="text-[11px] text-slate-400 truncate">
                Days: {doc.workingDays}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Doctor Modal */}
      <Modal
        isOpen={isAddOpen}
        onClose={() => setIsAddOpen(false)}
        title="Add New Specialist Profile"
        maxWidth="lg"
      >
        <form onSubmit={handleCreateDoctor} className="space-y-4 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-bold uppercase text-slate-500 mb-1">Doctor Name</label>
              <input
                type="text"
                placeholder="Dr. Alexander Wright, MD"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
              />
            </div>
            <div>
              <label className="block font-bold uppercase text-slate-500 mb-1">Email Address</label>
              <input
                type="email"
                placeholder="alexander@carepulse.demo"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block font-bold uppercase text-slate-500 mb-1">Specialisation</label>
              <select
                value={specialisation}
                onChange={(e) => setSpecialisation(e.target.value)}
                className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-bold"
              >
                <option value="Cardiology">Cardiology</option>
                <option value="Dermatology">Dermatology</option>
                <option value="Pediatrics">Pediatrics</option>
                <option value="Neurology">Neurology</option>
                <option value="Orthopedics">Orthopedics</option>
                <option value="General Medicine">General Medicine</option>
                <option value="Psychiatry">Psychiatry</option>
                <option value="ENT Specialist">ENT Specialist</option>
              </select>
            </div>

            <div>
              <label className="block font-bold uppercase text-slate-500 mb-1">Slot Duration</label>
              <select
                value={slotDuration}
                onChange={(e) => setSlotDuration(parseInt(e.target.value, 10))}
                className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-bold"
              >
                <option value={15}>15 Mins</option>
                <option value={20}>20 Mins</option>
                <option value={30}>30 Mins</option>
                <option value={45}>45 Mins</option>
                <option value={60}>60 Mins</option>
              </select>
            </div>

            <div>
              <label className="block font-bold uppercase text-slate-500 mb-1">Fee (₹ INR)</label>
              <input
                type="number"
                min={0}
                value={fee}
                onChange={(e) => setFee(parseFloat(e.target.value))}
                className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-bold"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold uppercase text-slate-500 mb-1">Start Time</label>
              <input
                type="time"
                value={workingStart}
                onChange={(e) => setWorkingStart(e.target.value)}
                className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
              />
            </div>
            <div>
              <label className="block font-bold uppercase text-slate-500 mb-1">End Time</label>
              <input
                type="time"
                value={workingEnd}
                onChange={(e) => setWorkingEnd(e.target.value)}
                className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
              />
            </div>
          </div>

          <div>
            <label className="block font-bold uppercase text-slate-500 mb-1">Doctor Biography</label>
            <textarea
              rows={2}
              placeholder="Background, certifications, and medical focus..."
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
            />
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold flex items-center justify-center gap-2 shadow-md transition-all disabled:opacity-50"
          >
            {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
            <span>Create Specialist Account & Slots</span>
          </button>
        </form>
      </Modal>
    </div>
  );
};
