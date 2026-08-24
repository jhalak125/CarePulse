import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext.js';
import { calendarApi } from '../../services/api.js';
import {
  Activity,
  Calendar,
  User,
  Stethoscope,
  Shield,
  LogOut,
  Moon,
  Sun,
  ExternalLink,
} from 'lucide-react';

interface NavbarProps {
  activeTab: 'home' | 'patient' | 'doctor' | 'admin';
  setActiveTab: (tab: 'home' | 'patient' | 'doctor' | 'admin') => void;
}

export const Navbar: React.FC<NavbarProps> = ({ activeTab, setActiveTab }) => {
  const { user, logout, isAuthenticated } = useAuth();
  const [darkMode, setDarkMode] = useState<boolean>(() => {
    return localStorage.getItem('carepulse_theme') === 'dark';
  });
  const [isCalConnected, setIsCalConnected] = useState<boolean>(false);

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('carepulse_theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('carepulse_theme', 'light');
    }
  }, [darkMode]);

  useEffect(() => {
    if (isAuthenticated) {
      calendarApi.getStatus().then((res) => {
        if (res.data.success) {
          setIsCalConnected(res.data.connected);
        }
      }).catch(() => {});
    }
  }, [isAuthenticated]);

  const handleConnectCalendar = async () => {
    try {
      const res = await calendarApi.getAuthUrl();
      if (res.data.success && res.data.url) {
        window.location.href = res.data.url;
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <header className="sticky top-0 z-40 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border-b border-slate-200/80 dark:border-slate-800/80 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand */}
        <div
          onClick={() => setActiveTab('home')}
          className="flex items-center gap-2.5 cursor-pointer group"
        >
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-brand-600 to-teal-400 flex items-center justify-center text-white shadow-md shadow-brand-500/20 group-hover:scale-105 transition-transform">
            <Activity className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <span className="text-xl font-black tracking-tight text-slate-900 dark:text-white flex items-center gap-1">
              Care<span className="text-brand-500">Pulse</span>
            </span>
            <span className="hidden sm:block text-[10px] font-medium tracking-wider text-slate-400 uppercase">
              Clinical Manager & AI Care
            </span>
          </div>
        </div>

        {/* Portal Tabs */}
        <nav className="flex items-center gap-1 sm:gap-2">
          <button
            onClick={() => setActiveTab('patient')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs sm:text-sm font-semibold transition-all ${
              activeTab === 'patient'
                ? 'bg-brand-50 dark:bg-brand-950/60 text-brand-700 dark:text-brand-300 ring-1 ring-brand-500/30'
                : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <User className="w-4 h-4 text-brand-500" />
            <span>Patient Portal</span>
          </button>

          <button
            onClick={() => setActiveTab('doctor')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs sm:text-sm font-semibold transition-all ${
              activeTab === 'doctor'
                ? 'bg-teal-50 dark:bg-teal-950/60 text-teal-700 dark:text-teal-300 ring-1 ring-teal-500/30'
                : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <Stethoscope className="w-4 h-4 text-teal-500" />
            <span>Doctor Portal</span>
          </button>

          <button
            onClick={() => setActiveTab('admin')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs sm:text-sm font-semibold transition-all ${
              activeTab === 'admin'
                ? 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 ring-1 ring-indigo-500/30'
                : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <Shield className="w-4 h-4 text-indigo-500" />
            <span>Admin Portal</span>
          </button>
        </nav>

        {/* Right Actions */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Google Calendar Sync Indicator */}
          {isAuthenticated && (
            <button
              onClick={handleConnectCalendar}
              title={isCalConnected ? 'Google Calendar Connected' : 'Connect Google Calendar'}
              className={`hidden md:flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium border transition-colors ${
                isCalConnected
                  ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-300 dark:border-slate-700 hover:border-brand-500'
              }`}
            >
              <Calendar className="w-3.5 h-3.5" />
              <span>{isCalConnected ? 'G-Calendar Synced' : 'Sync Calendar'}</span>
              {!isCalConnected && <ExternalLink className="w-3 h-3 text-slate-400" />}
            </button>
          )}

          {/* Dark Mode Toggle */}
          <button
            onClick={() => setDarkMode(!darkMode)}
            className="p-2 rounded-xl text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            title="Toggle theme"
          >
            {darkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>

          {/* User Info / Logout */}
          {isAuthenticated ? (
            <div className="flex items-center gap-2 pl-2 border-l border-slate-200 dark:border-slate-800">
              <div className="hidden lg:block text-right">
                <div className="text-xs font-bold text-slate-900 dark:text-white leading-tight">
                  {user?.name}
                </div>
                <div className="text-[10px] text-slate-400 font-medium">
                  {user?.email}
                </div>
              </div>
              <button
                onClick={logout}
                title="Logout"
                className="p-2 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <button
              onClick={() => setActiveTab('patient')}
              className="px-4 py-2 rounded-xl text-xs font-bold bg-brand-500 hover:bg-brand-600 text-white shadow-sm transition-all"
            >
              Get Started
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
