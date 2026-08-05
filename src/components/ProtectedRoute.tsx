import React from 'react';
import { useAuth } from '../hooks/useAuth';
import { Lock, ShieldAlert, LogIn, Loader2 } from 'lucide-react';

interface ProtectedRouteProps {
  children: React.ReactNode;
  onOpenLogin?: () => void;
  fallbackTitle?: string;
  fallbackDescription?: string;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  onOpenLogin,
  fallbackTitle = 'Authentication Required',
  fallbackDescription = 'Please log in or register to access this protected area.',
}) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-12 text-center shadow-xl space-y-4 animate-pulse">
        <div className="w-10 h-10 border-2 border-sky-400/30 border-t-sky-400 rounded-full animate-spin mx-auto" />
        <p className="text-xs font-semibold text-slate-400">Verifying security session...</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="bg-slate-900/95 border border-slate-800/90 rounded-2xl p-10 text-center shadow-2xl max-w-lg mx-auto space-y-6 my-8 backdrop-blur-xl">
        <div className="p-4 bg-sky-500/10 border border-sky-500/20 rounded-2xl text-sky-400 w-fit mx-auto shadow-inner">
          <Lock className="w-8 h-8" />
        </div>

        <div className="space-y-2">
          <h3 className="text-lg font-bold text-slate-100">{fallbackTitle}</h3>
          <p className="text-xs text-slate-400 leading-relaxed max-w-sm mx-auto">
            {fallbackDescription}
          </p>
        </div>

        {onOpenLogin && (
          <button
            onClick={onOpenLogin}
            className="px-6 py-2.5 bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-400 hover:to-blue-500 text-white rounded-xl text-xs font-bold transition-all shadow-lg shadow-sky-500/20 flex items-center gap-2 mx-auto"
          >
            <LogIn className="w-4 h-4" />
            <span>Log In to CogniCode</span>
          </button>
        )}
      </div>
    );
  }

  return <>{children}</>;
};
