import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext.js';
import { Activity, Lock, Mail, ArrowRight, Loader2, Sparkles } from 'lucide-react';

interface LoginPageProps {
  onRegisterClick: () => void;
  onSuccess: () => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({ onRegisterClick, onSuccess }) => {
  const { login, demoLogin, isLoading } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const ok = await login(email, password);
    if (ok) onSuccess();
  };

  const handleDemo = async (role: 'PATIENT' | 'DOCTOR' | 'ADMIN') => {
    const ok = await demoLogin(role);
    if (ok) onSuccess();
  };

  return (
    <div className="max-w-md mx-auto my-8 glass-card rounded-3xl p-8 space-y-6">
      <div className="text-center space-y-2">
        <div className="w-12 h-12 rounded-2xl bg-brand-500 text-white flex items-center justify-center mx-auto shadow-lg shadow-brand-500/30">
          <Activity className="w-6 h-6 animate-pulse" />
        </div>
        <h2 className="text-xl font-black text-slate-900 dark:text-white">
          Welcome to CarePulse
        </h2>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          Sign in to access your healthcare portal & care plans
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4 text-xs">
        <div>
          <label className="block font-bold uppercase text-slate-500 mb-1">Email Address</label>
          <div className="relative">
            <Mail className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="name@example.com"
              className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
            />
          </div>
        </div>

        <div>
          <label className="block font-bold uppercase text-slate-500 mb-1">Password</label>
          <div className="relative">
            <Lock className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="w-full py-3 rounded-xl bg-brand-500 hover:bg-brand-600 text-white font-bold flex items-center justify-center gap-2 shadow-md transition-all disabled:opacity-50"
        >
          {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <ArrowRight className="w-4 h-4" />}
          <span>Sign In</span>
        </button>
      </form>

      {/* Demo Fast Login Buttons */}
      <div className="pt-4 border-t border-slate-100 dark:border-slate-800 space-y-2">
        <div className="text-[11px] font-bold text-center text-slate-400 uppercase tracking-wider flex items-center justify-center gap-1">
          <Sparkles className="w-3.5 h-3.5 text-amber-500" />
          <span>Quick Evaluator Demo Sign In</span>
        </div>

        <div className="grid grid-cols-3 gap-2 text-[11px]">
          <button
            type="button"
            onClick={() => handleDemo('PATIENT')}
            className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 font-bold border border-emerald-200 dark:border-emerald-800 hover:bg-emerald-100 transition-all text-center"
          >
            Patient
          </button>
          <button
            type="button"
            onClick={() => handleDemo('DOCTOR')}
            className="p-2 rounded-xl bg-teal-50 dark:bg-teal-950 text-teal-700 dark:text-teal-300 font-bold border border-teal-200 dark:border-teal-800 hover:bg-teal-100 transition-all text-center"
          >
            Doctor
          </button>
          <button
            type="button"
            onClick={() => handleDemo('ADMIN')}
            className="p-2 rounded-xl bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 font-bold border border-indigo-200 dark:border-indigo-800 hover:bg-indigo-100 transition-all text-center"
          >
            Admin
          </button>
        </div>
      </div>

      <div className="text-center text-xs text-slate-500">
        Don't have an account?{' '}
        <button
          type="button"
          onClick={onRegisterClick}
          className="font-bold text-brand-600 dark:text-brand-400 hover:underline"
        >
          Create Patient Account
        </button>
      </div>
    </div>
  );
};
