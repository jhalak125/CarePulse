import React, { useState } from 'react';
import { useAuth } from './context/AuthContext.js';
import { Navbar } from './components/common/Navbar.js';
import { QuickRoleSwitcher } from './components/common/QuickRoleSwitcher.js';
import { HomePage } from './pages/HomePage.js';
import { PatientPortalPage } from './pages/PatientPortalPage.js';
import { DoctorPortalPage } from './pages/DoctorPortalPage.js';
import { AdminPortalPage } from './pages/AdminPortalPage.js';
import { LoginPage } from './pages/LoginPage.js';
import { RegisterPage } from './pages/RegisterPage.js';
import { Modal } from './components/common/Modal.js';
import {
  Activity,
  ShieldCheck,
  Stethoscope,
  User,
  Sparkles,
  Lock,
  Calendar,
} from 'lucide-react';

export const App: React.FC = () => {
  const { user, isAuthenticated, demoLogin } = useAuth();
  const [activeTab, setActiveTab] = useState<'home' | 'patient' | 'doctor' | 'admin'>('home');
  const [authModal, setAuthModal] = useState<'LOGIN' | 'REGISTER' | null>(null);

  const handlePortalSwitch = (tab: 'home' | 'patient' | 'doctor' | 'admin') => {
    setActiveTab(tab);
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950 transition-colors">
      {/* Top Demo Switcher Bar */}
      <QuickRoleSwitcher />

      {/* Main Navbar */}
      <Navbar activeTab={activeTab} setActiveTab={handlePortalSwitch} />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {activeTab === 'home' && <HomePage onNavigate={handlePortalSwitch} />}

        {activeTab === 'patient' && (
          <div>
            {!isAuthenticated ? (
              <div className="max-w-md mx-auto my-12 glass-card rounded-3xl p-8 text-center space-y-6">
                <div className="w-14 h-14 rounded-2xl bg-brand-500/10 text-brand-600 dark:text-brand-400 flex items-center justify-center mx-auto">
                  <User className="w-7 h-7" />
                </div>
                <div className="space-y-2">
                  <h3 className="text-xl font-black text-slate-900 dark:text-white">
                    Patient Portal Access
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Sign in to your patient account or launch the instant demo persona.
                  </p>
                </div>

                <div className="space-y-3 pt-2">
                  <button
                    onClick={() => demoLogin('PATIENT')}
                    className="w-full py-3 rounded-xl bg-brand-500 hover:bg-brand-600 text-white text-xs font-bold shadow-md shadow-brand-500/20 flex items-center justify-center gap-2 transition-all"
                  >
                    <Sparkles className="w-4 h-4" />
                    <span>Continue as Aarav Sharma (Demo Patient)</span>
                  </button>

                  <button
                    onClick={() => setAuthModal('LOGIN')}
                    className="w-full py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 text-xs font-bold hover:bg-slate-50 transition-all"
                  >
                    Sign In with Email & Password
                  </button>
                </div>
              </div>
            ) : (
              <PatientPortalPage />
            )}
          </div>
        )}

        {activeTab === 'doctor' && (
          <div>
            {!isAuthenticated || user?.role !== 'DOCTOR' ? (
              <div className="max-w-md mx-auto my-12 glass-card rounded-3xl p-8 text-center space-y-6">
                <div className="w-14 h-14 rounded-2xl bg-teal-500/10 text-teal-600 dark:text-teal-400 flex items-center justify-center mx-auto">
                  <Stethoscope className="w-7 h-7" />
                </div>
                <div className="space-y-2">
                  <h3 className="text-xl font-black text-slate-900 dark:text-white">
                    Physician Portal Access
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Requires verified Doctor credentials or the instant Physician Demo session.
                  </p>
                </div>

                <div className="space-y-3 pt-2">
                  <button
                    onClick={() => demoLogin('DOCTOR')}
                    className="w-full py-3 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold shadow-md shadow-teal-600/20 flex items-center justify-center gap-2 transition-all"
                  >
                    <Sparkles className="w-4 h-4" />
                    <span>Launch as Dr. Rajesh Swaminathan (Cardiologist)</span>
                  </button>

                  <button
                    onClick={() => setAuthModal('LOGIN')}
                    className="w-full py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 text-xs font-bold hover:bg-slate-50 transition-all"
                  >
                    Physician Sign In
                  </button>
                </div>
              </div>
            ) : (
              <DoctorPortalPage />
            )}
          </div>
        )}

        {activeTab === 'admin' && (
          <div>
            {!isAuthenticated || user?.role !== 'ADMIN' ? (
              <div className="max-w-md mx-auto my-12 glass-card rounded-3xl p-8 text-center space-y-6">
                <div className="w-14 h-14 rounded-2xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mx-auto">
                  <ShieldCheck className="w-7 h-7" />
                </div>
                <div className="space-y-2">
                  <h3 className="text-xl font-black text-slate-900 dark:text-white">
                    Clinic Administration Access
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Restricted to clinic administrators and system operators.
                  </p>
                </div>

                <div className="space-y-3 pt-2">
                  <button
                    onClick={() => demoLogin('ADMIN')}
                    className="w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-md shadow-indigo-600/20 flex items-center justify-center gap-2 transition-all"
                  >
                    <Sparkles className="w-4 h-4" />
                    <span>Continue as Sunita Agarwal (Admin Demo)</span>
                  </button>

                  <button
                    onClick={() => setAuthModal('LOGIN')}
                    className="w-full py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 text-xs font-bold hover:bg-slate-50 transition-all"
                  >
                    Admin Sign In
                  </button>
                </div>
              </div>
            ) : (
              <AdminPortalPage />
            )}
          </div>
        )}
      </main>

      {/* Auth Modals */}
      <Modal
        isOpen={authModal === 'LOGIN'}
        onClose={() => setAuthModal(null)}
        title="Account Sign In"
        maxWidth="md"
      >
        <LoginPage
          onRegisterClick={() => setAuthModal('REGISTER')}
          onSuccess={() => setAuthModal(null)}
        />
      </Modal>

      <Modal
        isOpen={authModal === 'REGISTER'}
        onClose={() => setAuthModal(null)}
        title="Patient Registration"
        maxWidth="md"
      >
        <RegisterPage
          onLoginClick={() => setAuthModal('LOGIN')}
          onSuccess={() => setAuthModal(null)}
        />
      </Modal>

      {/* Footer */}
      <footer className="mt-auto border-t border-slate-200/80 dark:border-slate-800/80 bg-white/50 dark:bg-slate-900/50 py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500 dark:text-slate-400">
          <div className="flex items-center gap-2">
            <Activity className="w-4 h-4 text-brand-500" />
            <span className="font-bold text-slate-700 dark:text-slate-200">CarePulse Healthcare Platform</span>
            <span>• Concurrency Controlled & AI Powered</span>
          </div>

          <div className="flex items-center gap-4">
            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" /> Live Background Schedulers Active
            </span>
            <span>&copy; 2026 CarePulse Systems</span>
          </div>
        </div>
      </footer>
    </div>
  );
};
export default App;
