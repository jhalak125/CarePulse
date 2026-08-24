import React from 'react';
import { useAuth } from '../../context/AuthContext.js';
import { User, Stethoscope, ShieldCheck, Sparkles } from 'lucide-react';

export const QuickRoleSwitcher: React.FC = () => {
  const { user, demoLogin, isLoading } = useAuth();

  return (
    <div className="bg-slate-900 text-white py-1.5 px-3 sm:px-6 flex flex-wrap items-center justify-between text-xs gap-2 border-b border-slate-800">
      <div className="flex items-center gap-1.5 text-slate-300 font-medium">
        <Sparkles className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
        <span className="hidden sm:inline">Quick Evaluator Persona Switcher:</span>
        <span className="text-slate-400">Current Role:</span>
        <span className="font-bold text-emerald-400 uppercase bg-slate-800 px-2 py-0.5 rounded">
          {user?.role || 'Guest'}
        </span>
      </div>

      <div className="flex items-center gap-2">
        <button
          disabled={isLoading}
          onClick={() => demoLogin('PATIENT')}
          className={`flex items-center gap-1 px-2.5 py-1 rounded font-medium transition-all ${
            user?.role === 'PATIENT'
              ? 'bg-emerald-600 text-white ring-1 ring-emerald-400 shadow-sm'
              : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
          }`}
        >
          <User className="w-3 h-3" />
          <span>Aarav Sharma (Patient)</span>
        </button>

        <button
          disabled={isLoading}
          onClick={() => demoLogin('DOCTOR')}
          className={`flex items-center gap-1 px-2.5 py-1 rounded font-medium transition-all ${
            user?.role === 'DOCTOR'
              ? 'bg-teal-600 text-white ring-1 ring-teal-400 shadow-sm'
              : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
          }`}
        >
          <Stethoscope className="w-3 h-3" />
          <span>Dr. Rajesh Swaminathan (Doctor)</span>
        </button>

        <button
          disabled={isLoading}
          onClick={() => demoLogin('ADMIN')}
          className={`flex items-center gap-1 px-2.5 py-1 rounded font-medium transition-all ${
            user?.role === 'ADMIN'
              ? 'bg-indigo-600 text-white ring-1 ring-indigo-400 shadow-sm'
              : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
          }`}
        >
          <ShieldCheck className="w-3 h-3" />
          <span>Sunita Agarwal (Admin)</span>
        </button>
      </div>
    </div>
  );
};
