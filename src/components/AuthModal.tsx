import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, ShieldCheck, LogIn, UserPlus } from 'lucide-react';
import { LoginForm } from './LoginForm';
import { RegisterForm } from './RegisterForm';

interface AuthModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  initialTab?: 'login' | 'register';
}

type Tab = 'login' | 'register';

export const AuthModal: React.FC<AuthModalProps> = ({
  open,
  onClose,
  onSuccess,
  initialTab = 'login',
}) => {
  const [tab, setTab] = useState<Tab>(initialTab);

  useEffect(() => {
    if (open) {
      setTab(initialTab);
      const onKey = (e: KeyboardEvent) => {
        if (e.key === 'Escape') onClose();
      };
      document.addEventListener('keydown', onKey);
      document.body.style.overflow = 'hidden';
      return () => {
        document.removeEventListener('keydown', onKey);
        document.body.style.overflow = '';
      };
    }
  }, [open, initialTab, onClose]);

  const handleSuccess = () => {
    onSuccess?.();
    onClose();
  };

  return (
    <AnimatePresence>
      {open && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="auth-modal-title"
        >
          <motion.div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          <motion.div
            className="relative w-full max-w-md overflow-hidden bg-slate-900/95 border border-slate-800/90 backdrop-blur-2xl rounded-3xl shadow-2xl"
            initial={{ opacity: 0, scale: 0.96, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 12 }}
            transition={{ type: 'spring', stiffness: 320, damping: 28 }}
          >
            <div className="flex items-center justify-between border-b border-slate-800 px-5 py-4">
              <h2 id="auth-modal-title" className="text-sm font-bold text-slate-100 tracking-tight">
                {tab === 'login' ? 'Welcome back to CogniCode' : 'Create your CogniCode account'}
              </h2>
              <button
                type="button"
                onClick={onClose}
                className="btn btn-ghost p-1.5 rounded-md"
                aria-label="Close authentication dialog"
              >
                <X className="w-4 h-4" aria-hidden="true" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-1 p-4 pb-0" role="tablist" aria-label="Authentication method">
              <button
                type="button"
                role="tab"
                aria-selected={tab === 'login'}
                onClick={() => setTab('login')}
                className={`flex items-center justify-center gap-1.5 rounded-xl px-3 py-2 text-xs font-bold transition-all ${
                  tab === 'login'
                    ? 'bg-gradient-to-r from-sky-500 to-blue-600 text-white shadow-lg shadow-sky-500/20'
                    : 'bg-slate-950 text-slate-400 hover:text-slate-200 border border-slate-800'
                }`}
              >
                <LogIn className="w-3.5 h-3.5" aria-hidden="true" />
                Login
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={tab === 'register'}
                onClick={() => setTab('register')}
                className={`flex items-center justify-center gap-1.5 rounded-xl px-3 py-2 text-xs font-bold transition-all ${
                  tab === 'register'
                    ? 'bg-gradient-to-r from-sky-500 to-blue-600 text-white shadow-lg shadow-sky-500/20'
                    : 'bg-slate-950 text-slate-400 hover:text-slate-200 border border-slate-800'
                }`}
              >
                <UserPlus className="w-3.5 h-3.5" aria-hidden="true" />
                Register
              </button>
            </div>

            <div className="p-5 max-h-[70vh] overflow-y-auto">
              <AnimatePresence mode="wait" initial={false}>
                <motion.div
                  key={tab}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.18 }}
                >
                  {tab === 'login' ? (
                    <LoginForm onSwitchToRegister={() => setTab('register')} onSuccess={handleSuccess} />
                  ) : (
                    <RegisterForm onSwitchToLogin={() => setTab('login')} onSuccess={handleSuccess} />
                  )}
                </motion.div>
              </AnimatePresence>

              <p className="mt-4 flex items-center justify-center gap-1.5 text-center text-[11px] text-slate-500 font-mono">
                <ShieldCheck className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                Protected by Firebase Auth &amp; CogniCode Security
              </p>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default AuthModal;
