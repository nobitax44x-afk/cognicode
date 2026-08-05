import React from 'react';
import { CogniCodeLogo } from './CogniCodeLogo';

interface AuthLayoutProps {
  children: React.ReactNode;
  title: string;
  subtitle: string;
}

export const AuthLayout: React.FC<AuthLayoutProps> = ({ children, title, subtitle }) => {
  return (
    <div className="min-h-screen bg-[#0B1120] text-slate-100 flex flex-col justify-center items-center p-4 sm:p-6 relative overflow-hidden">
      
      {/* Background Futuristic Ambient Blur Glows */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-gradient-to-tr from-sky-500/10 via-blue-600/10 to-purple-600/10 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute bottom-10 right-10 w-80 h-80 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute top-10 left-10 w-80 h-80 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none"></div>

      {/* Main Glassmorphic Card */}
      <div className="w-full max-w-md relative z-10 bg-slate-900/90 border border-slate-800/90 backdrop-blur-2xl rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6 animate-fadeIn">
        
        {/* Brand Header */}
        <div className="flex flex-col items-center text-center space-y-3">
          <CogniCodeLogo size="lg" variant="stacked" showSubtitle={true} />
          <div className="space-y-1 pt-2">
            <h2 className="text-xl font-extrabold text-slate-100 tracking-tight">{title}</h2>
            <p className="text-xs text-slate-400 leading-relaxed max-w-xs mx-auto">{subtitle}</p>
          </div>
        </div>

        {/* Form Body */}
        {children}

      </div>

      {/* Footer Branding */}
      <div className="relative z-10 mt-8 text-center text-[11px] text-slate-500 font-mono">
        Protected by Firebase Auth & CogniCode Security
      </div>

    </div>
  );
};
