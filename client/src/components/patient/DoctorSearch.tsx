import React, { useState, useEffect } from 'react';
import { DoctorProfile } from '../../types/index.js';
import { doctorApi } from '../../services/api.js';
import { Search, Star, Clock, Calendar, Stethoscope, ChevronRight, Award } from 'lucide-react';

interface DoctorSearchProps {
  onSelectDoctor: (doctor: DoctorProfile) => void;
  selectedDoctorId?: string | null;
}

const SPECIALISATIONS = [
  'All',
  'Cardiology',
  'Dermatology',
  'Pediatrics',
  'Neurology',
  'Orthopedics',
  'General Medicine',
];

export const DoctorSearch: React.FC<DoctorSearchProps> = ({
  onSelectDoctor,
  selectedDoctorId,
}) => {
  const [doctors, setDoctors] = useState<DoctorProfile[]>([]);
  const [selectedSpec, setSelectedSpec] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    fetchDoctors();
  }, [selectedSpec, searchQuery]);

  const fetchDoctors = async () => {
    try {
      setLoading(true);
      const res = await doctorApi.getDoctors({
        specialisation: selectedSpec,
        search: searchQuery,
      });
      if (res.data.success) {
        setDoctors(res.data.doctors);
      }
    } catch (err) {
      console.error('Failed to load doctors:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Search and Filters */}
      <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
        {/* Search Bar */}
        <div className="relative w-full md:w-96">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search doctors, specialities, symptoms..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 transition-all text-slate-900 dark:text-white"
          />
        </div>

        {/* Specialisation Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto w-full md:w-auto pb-2 md:pb-0 scrollbar-none">
          {SPECIALISATIONS.map((spec) => (
            <button
              key={spec}
              onClick={() => setSelectedSpec(spec)}
              className={`px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all ${
                selectedSpec === spec
                  ? 'bg-brand-500 text-white shadow-sm shadow-brand-500/30'
                  : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-800 hover:border-brand-500'
              }`}
            >
              {spec}
            </button>
          ))}
        </div>
      </div>

      {/* Doctor Cards Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {[1, 2, 3].map((i) => (
            <div key={i} className="glass-card rounded-2xl p-6 animate-pulse space-y-4">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-full bg-slate-200 dark:bg-slate-800" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-3/4" />
                  <div className="h-3 bg-slate-200 dark:bg-slate-800 rounded w-1/2" />
                </div>
              </div>
              <div className="h-16 bg-slate-100 dark:bg-slate-800/50 rounded-xl" />
              <div className="h-10 bg-slate-200 dark:bg-slate-800 rounded-xl" />
            </div>
          ))}
        </div>
      ) : doctors.length === 0 ? (
        <div className="text-center py-12 glass-card rounded-2xl">
          <Stethoscope className="w-12 h-12 mx-auto text-slate-300 dark:text-slate-600 mb-3" />
          <h3 className="text-base font-bold text-slate-800 dark:text-slate-200">No Specialists Found</h3>
          <p className="text-xs text-slate-500 mt-1">Try refining your search query or selecting "All" specialisations.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {doctors.map((doctor) => {
            const isSelected = selectedDoctorId === doctor.id;
            return (
              <div
                key={doctor.id}
                className={`glass-card-hover rounded-2xl p-5 flex flex-col justify-between relative transition-all ${
                  isSelected
                    ? 'ring-2 ring-brand-500 bg-brand-50/20 dark:bg-brand-950/20'
                    : ''
                }`}
              >
                <div>
                  {/* Top Doctor Info */}
                  <div className="flex items-start gap-3.5">
                    <img
                      src={
                        doctor.user.avatarUrl ||
                        `https://images.unsplash.com/photo-1622253692010-333f2da6031d?w=150&auto=format&fit=crop&q=80`
                      }
                      alt={doctor.user.name}
                      className="w-14 h-14 rounded-2xl object-cover border border-slate-200 dark:border-slate-800 shadow-sm"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-brand-600 dark:text-brand-400 bg-brand-50 dark:bg-brand-950/80 px-2 py-0.5 rounded-md uppercase tracking-wider">
                          {doctor.specialisation}
                        </span>
                        <div className="flex items-center gap-1 text-xs font-bold text-amber-500">
                          <Star className="w-3.5 h-3.5 fill-amber-400" />
                          <span>{doctor.rating.toFixed(1)}</span>
                        </div>
                      </div>
                      <h3 className="text-base font-bold text-slate-900 dark:text-white mt-1 truncate">
                        {doctor.user.name}
                      </h3>
                      <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                        <Award className="w-3.5 h-3.5 text-slate-400" />
                        <span>{doctor.experienceYears}+ years exp.</span>
                      </div>
                    </div>
                  </div>

                  {/* Bio */}
                  {doctor.bio && (
                    <p className="text-xs text-slate-600 dark:text-slate-300 line-clamp-2 mt-3 leading-relaxed">
                      {doctor.bio}
                    </p>
                  )}

                  {/* Badges / Hours Info */}
                  <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800/80 grid grid-cols-2 gap-2 text-xs text-slate-500 dark:text-slate-400">
                    <div className="flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-slate-400" />
                      <span>{doctor.workingHoursStart} - {doctor.workingHoursEnd}</span>
                    </div>
                    <div className="flex items-center gap-1.5 justify-end">
                      <span className="font-bold text-slate-900 dark:text-white text-sm">
                        ₹{doctor.consultationFee.toFixed(0)}
                      </span>
                      <span className="text-[11px]">/ {doctor.slotDurationMinutes}m</span>
                    </div>
                  </div>
                </div>

                {/* Select Button */}
                <button
                  onClick={() => onSelectDoctor(doctor)}
                  className={`mt-4 w-full py-2.5 px-4 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
                    isSelected
                      ? 'bg-brand-600 text-white shadow-md shadow-brand-600/30'
                      : 'bg-slate-100 hover:bg-brand-500 text-slate-700 hover:text-white dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-brand-500'
                  }`}
                >
                  <span>{isSelected ? 'Selected Specialist' : 'Book Appointment'}</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
