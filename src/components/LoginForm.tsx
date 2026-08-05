import React, { useState } from 'react';
import { Mail, Lock, Eye, EyeOff, LogIn, Github } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { useToast } from './Toast';
import { ForgotPasswordModal } from './ForgotPasswordModal';

interface LoginFormProps {
  onSwitchToRegister: () => void;
  onSuccess?: () => void;
}

export const LoginForm: React.FC<LoginFormProps> = ({ onSwitchToRegister, onSuccess }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [githubLoading, setGithubLoading] = useState(false);
  const [forgotModalOpen, setForgotModalOpen] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<{ email?: string; password?: string }>({});

  const { loginWithEmail, loginWithGoogle, loginWithGithub, getFriendlyErrorMessage } = useAuth();
  const toast = useToast();

  const validateForm = (): boolean => {
    const errors: { email?: string; password?: string } = {};
    if (!email.trim()) {
      errors.email = 'Email address is required.';
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      errors.email = 'Please enter a valid email address.';
    }

    if (!password) {
      errors.password = 'Password is required.';
    } else if (password.length < 8) {
      errors.password = 'Password must be at least 8 characters long.';
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsLoading(true);
    try {
      await loginWithEmail(email.trim(), password, rememberMe);
      toast.success('Login Successful', 'Welcome back to CogniCode AI Documentation Platform!');
      onSuccess?.();
    } catch (err: any) {
      toast.error('Authentication Error', getFriendlyErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setGoogleLoading(true);
    try {
      await loginWithGoogle();
      toast.success('Google Login Successful', 'Signed in seamlessly with Google.');
      onSuccess?.();
    } catch (err: any) {
      if (err.code !== 'auth/popup-closed-by-user') {
        toast.error('Google Sign In Failed', getFriendlyErrorMessage(err));
      }
    } finally {
      setGoogleLoading(false);
    }
  };

  const handleGithubLogin = async () => {
    setGithubLoading(true);
    try {
      await loginWithGithub();
      toast.success('GitHub Login Successful', 'Connected with GitHub account.');
      onSuccess?.();
    } catch (err: any) {
      if (err.code !== 'auth/popup-closed-by-user') {
        toast.error('GitHub Sign In Failed', getFriendlyErrorMessage(err));
      }
    } finally {
      setGithubLoading(false);
    }
  };

  return (
    <div className="space-y-5">
      <form onSubmit={handleEmailLogin} className="space-y-4">
        
        {/* Email Field */}
        <div>
          <label className="block text-xs font-semibold text-slate-300 mb-1.5">
            Email Address
          </label>
          <div className="relative">
            <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                if (fieldErrors.email) setFieldErrors((prev) => ({ ...prev, email: undefined }));
              }}
              placeholder="developer@example.com"
              className={`w-full bg-slate-950 border rounded-xl pl-10 pr-4 py-2.5 text-xs text-slate-100 placeholder-slate-500 focus:outline-none transition-all font-mono ${
                fieldErrors.email
                  ? 'border-rose-500/80 focus:border-rose-500'
                  : 'border-slate-800 focus:border-sky-500'
              }`}
            />
          </div>
          {fieldErrors.email && (
            <p className="text-[11px] text-rose-400 mt-1 pl-1 font-medium">{fieldErrors.email}</p>
          )}
        </div>

        {/* Password Field */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="block text-xs font-semibold text-slate-300">
              Password
            </label>
            <button
              type="button"
              onClick={() => setForgotModalOpen(true)}
              className="text-[11px] text-sky-400 hover:text-sky-300 transition-colors font-medium hover:underline"
            >
              Forgot Password?
            </button>
          </div>
          <div className="relative">
            <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                if (fieldErrors.password) setFieldErrors((prev) => ({ ...prev, password: undefined }));
              }}
              placeholder="••••••••••••"
              className={`w-full bg-slate-950 border rounded-xl pl-10 pr-10 py-2.5 text-xs text-slate-100 placeholder-slate-500 focus:outline-none transition-all font-mono ${
                fieldErrors.password
                  ? 'border-rose-500/80 focus:border-rose-500'
                  : 'border-slate-800 focus:border-sky-500'
              }`}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
          {fieldErrors.password && (
            <p className="text-[11px] text-rose-400 mt-1 pl-1 font-medium">{fieldErrors.password}</p>
          )}
        </div>

        {/* Remember Me Checkbox */}
        <div className="flex items-center justify-between">
          <label className="flex items-center gap-2 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
              className="w-4 h-4 rounded bg-slate-950 border-slate-800 text-sky-500 focus:ring-0 focus:ring-offset-0 cursor-pointer accent-sky-500"
            />
            <span className="text-xs text-slate-400">Remember Me</span>
          </label>
        </div>

        {/* Submit Login Button */}
        <button
          type="submit"
          disabled={isLoading}
          className="w-full py-2.5 bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-400 hover:to-blue-500 active:scale-[0.99] disabled:opacity-50 text-white rounded-xl text-xs font-bold transition-all shadow-lg shadow-sky-500/20 flex items-center justify-center gap-2"
        >
          {isLoading ? (
            <>
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              <span>Logging in...</span>
            </>
          ) : (
            <>
              <LogIn className="w-4 h-4" />
              <span>Log In to Account</span>
            </>
          )}
        </button>

      </form>

      {/* Social Auth Divider */}
      <div className="relative flex items-center justify-center py-1">
        <div className="w-full border-t border-slate-800"></div>
        <span className="bg-slate-900 px-3 text-[10px] font-bold uppercase tracking-wider text-slate-500 absolute font-mono">
          ──────── OR ────────
        </span>
      </div>

      {/* Social Logins */}
      <div className="space-y-2.5 pt-1">
        <button
          type="button"
          onClick={handleGoogleLogin}
          disabled={googleLoading}
          className="w-full py-2.5 bg-slate-950 hover:bg-slate-900 border border-slate-800 rounded-xl text-xs font-semibold text-slate-200 transition-all flex items-center justify-center gap-2.5 shadow-sm active:scale-[0.99] disabled:opacity-50"
        >
          {googleLoading ? (
            <div className="w-4 h-4 border-2 border-slate-400/30 border-t-slate-200 rounded-full animate-spin" />
          ) : (
            <svg className="w-4 h-4" viewBox="0 0 24 24">
              <path
                fill="#EA4335"
                d="M12 5c1.6 0 3 .6 4.1 1.6l3.1-3.1C17.3 1.7 14.8 1 12 1 7.5 1 3.7 3.6 1.9 7.3l3.7 2.9C6.5 7.2 9 5 12 5z"
              />
              <path
                fill="#4285F4"
                d="M23.5 12.3c0-.8-.1-1.6-.2-2.3H12v4.5h6.5c-.3 1.5-1.1 2.8-2.4 3.7l3.7 2.9c2.2-2 3.7-5 3.7-8.8z"
              />
              <path
                fill="#FBBC05"
                d="M5.6 14.8c-.2-.7-.4-1.5-.4-2.3s.2-1.6.4-2.3L1.9 7.3C.7 9.7 0 10.8 0 12.5s.7 2.8 1.9 5.2l3.7-2.9z"
              />
              <path
                fill="#34A853"
                d="M12 23c3.2 0 6-1.1 8-3l-3.7-2.9c-1.1.7-2.5 1.2-4.3 1.2-3 0-5.5-2.2-6.4-5.2L1.9 16C3.7 19.7 7.5 23 12 23z"
              />
            </svg>
          )}
          <span>Continue with Google</span>
        </button>

        <button
          type="button"
          onClick={handleGithubLogin}
          disabled={githubLoading}
          className="w-full py-2.5 bg-slate-950 hover:bg-slate-900 border border-slate-800 rounded-xl text-xs font-semibold text-slate-200 transition-all flex items-center justify-center gap-2.5 shadow-sm active:scale-[0.99] disabled:opacity-50"
        >
          {githubLoading ? (
            <div className="w-4 h-4 border-2 border-slate-400/30 border-t-slate-200 rounded-full animate-spin" />
          ) : (
            <Github className="w-4 h-4 text-slate-100" />
          )}
          <span>Continue with GitHub</span>
        </button>
      </div>

      {/* Switch to Register */}
      <div className="text-center pt-2">
        <p className="text-xs text-slate-400">
          Don't have an account?{' '}
          <button
            type="button"
            onClick={onSwitchToRegister}
            className="text-sky-400 hover:text-sky-300 font-bold hover:underline transition-colors ml-0.5"
          >
            Register
          </button>
        </p>
      </div>

      {/* Password Reset Modal */}
      <ForgotPasswordModal
        isOpen={forgotModalOpen}
        onClose={() => setForgotModalOpen(false)}
        defaultEmail={email}
      />

    </div>
  );
};
