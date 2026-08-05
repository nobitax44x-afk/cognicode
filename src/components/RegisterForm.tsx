import React, { useState } from 'react';
import { User, Mail, Lock, Eye, EyeOff, UserPlus, Github, Check, X } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { useToast } from './Toast';

interface RegisterFormProps {
  onSwitchToLogin: () => void;
  onSuccess?: () => void;
}

export const RegisterForm: React.FC<RegisterFormProps> = ({ onSwitchToLogin, onSuccess }) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [githubLoading, setGithubLoading] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<{
    name?: string;
    email?: string;
    password?: string;
    confirmPassword?: string;
  }>({});

  const { signupWithEmail, loginWithGoogle, loginWithGithub, getFriendlyErrorMessage } = useAuth();
  const toast = useToast();

  // Password Strength Criteria Checks
  const passCriteria = {
    length: password.length >= 8,
    uppercase: /[A-Z]/.test(password),
    lowercase: /[a-z]/.test(password),
    number: /[0-9]/.test(password),
    special: /[^A-Za-z0-9]/.test(password),
  };

  const passScore = Object.values(passCriteria).filter(Boolean).length;

  const validateForm = (): boolean => {
    const errors: {
      name?: string;
      email?: string;
      password?: string;
      confirmPassword?: string;
    } = {};

    if (!name.trim()) {
      errors.name = 'Full name is required.';
    }

    if (!email.trim()) {
      errors.email = 'Email address is required.';
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      errors.email = 'Please enter a valid email address.';
    }

    if (!password) {
      errors.password = 'Password is required.';
    } else if (!passCriteria.length) {
      errors.password = 'Password must be at least 8 characters.';
    } else if (passScore < 4) {
      errors.password = 'Password must include uppercase, lowercase, numbers, and special characters.';
    }

    if (password !== confirmPassword) {
      errors.confirmPassword = 'Passwords do not match.';
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsLoading(true);
    try {
      await signupWithEmail(name.trim(), email.trim(), password);
      toast.success(
        'Registration Successful',
        `Welcome to CogniCode, ${name.trim()}! Your account has been created.`
      );
      onSuccess?.();
    } catch (err: any) {
      toast.error('Registration Failed', getFriendlyErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignup = async () => {
    setGoogleLoading(true);
    try {
      await loginWithGoogle();
      toast.success('Google Registration Successful', 'Account connected with Google.');
      onSuccess?.();
    } catch (err: any) {
      if (err.code !== 'auth/popup-closed-by-user') {
        toast.error('Google Auth Failed', getFriendlyErrorMessage(err));
      }
    } finally {
      setGoogleLoading(false);
    }
  };

  const handleGithubSignup = async () => {
    setGithubLoading(true);
    try {
      await loginWithGithub();
      toast.success('GitHub Registration Successful', 'Account connected with GitHub.');
      onSuccess?.();
    } catch (err: any) {
      if (err.code !== 'auth/popup-closed-by-user') {
        toast.error('GitHub Auth Failed', getFriendlyErrorMessage(err));
      }
    } finally {
      setGithubLoading(false);
    }
  };

  return (
    <div className="space-y-5">
      <form onSubmit={handleRegister} className="space-y-3.5">
        
        {/* Full Name Field */}
        <div>
          <label className="block text-xs font-semibold text-slate-300 mb-1">
            Full Name
          </label>
          <div className="relative">
            <User className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                if (fieldErrors.name) setFieldErrors((prev) => ({ ...prev, name: undefined }));
              }}
              placeholder="Nightmare Dev"
              className={`w-full bg-slate-950 border rounded-xl pl-10 pr-4 py-2 text-xs text-slate-100 placeholder-slate-500 focus:outline-none transition-all ${
                fieldErrors.name
                  ? 'border-rose-500/80 focus:border-rose-500'
                  : 'border-slate-800 focus:border-sky-500'
              }`}
            />
          </div>
          {fieldErrors.name && (
            <p className="text-[11px] text-rose-400 mt-1 pl-1 font-medium">{fieldErrors.name}</p>
          )}
        </div>

        {/* Email Address Field */}
        <div>
          <label className="block text-xs font-semibold text-slate-300 mb-1">
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
              placeholder="tawsifsabit51@gmail.com"
              className={`w-full bg-slate-950 border rounded-xl pl-10 pr-4 py-2 text-xs text-slate-100 placeholder-slate-500 focus:outline-none transition-all font-mono ${
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
          <label className="block text-xs font-semibold text-slate-300 mb-1">
            Password
          </label>
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
              className={`w-full bg-slate-950 border rounded-xl pl-10 pr-10 py-2 text-xs text-slate-100 placeholder-slate-500 focus:outline-none transition-all font-mono ${
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

          {/* Password Validation Requirements */}
          {password && (
            <div className="mt-2 p-2.5 bg-slate-950/80 border border-slate-800/80 rounded-xl space-y-1.5 text-[10px] font-mono">
              <div className="flex items-center justify-between text-[10px] text-slate-400">
                <span>Password Strength:</span>
                <span className={`font-bold ${
                  passScore <= 2 ? 'text-rose-400' : passScore <= 4 ? 'text-amber-400' : 'text-emerald-400'
                }`}>
                  {passScore <= 2 ? 'Weak' : passScore <= 4 ? 'Moderate' : 'Strong'}
                </span>
              </div>
              <div className="w-full bg-slate-800 h-1 rounded-full overflow-hidden">
                <div
                  className={`h-full transition-all duration-300 ${
                    passScore <= 2 ? 'bg-rose-500 w-1/3' : passScore <= 4 ? 'bg-amber-400 w-2/3' : 'bg-emerald-400 w-full'
                  }`}
                />
              </div>
              <div className="grid grid-cols-2 gap-1 pt-1 text-slate-400">
                <span className={`flex items-center gap-1 ${passCriteria.length ? 'text-emerald-400' : ''}`}>
                  {passCriteria.length ? <Check className="w-3 h-3" /> : <X className="w-3 h-3 text-slate-600" />} 8+ chars
                </span>
                <span className={`flex items-center gap-1 ${passCriteria.uppercase ? 'text-emerald-400' : ''}`}>
                  {passCriteria.uppercase ? <Check className="w-3 h-3" /> : <X className="w-3 h-3 text-slate-600" />} Uppercase
                </span>
                <span className={`flex items-center gap-1 ${passCriteria.number ? 'text-emerald-400' : ''}`}>
                  {passCriteria.number ? <Check className="w-3 h-3" /> : <X className="w-3 h-3 text-slate-600" />} Number
                </span>
                <span className={`flex items-center gap-1 ${passCriteria.special ? 'text-emerald-400' : ''}`}>
                  {passCriteria.special ? <Check className="w-3 h-3" /> : <X className="w-3 h-3 text-slate-600" />} Symbol (@$!%)
                </span>
              </div>
            </div>
          )}

          {fieldErrors.password && (
            <p className="text-[11px] text-rose-400 mt-1 pl-1 font-medium">{fieldErrors.password}</p>
          )}
        </div>

        {/* Confirm Password Field */}
        <div>
          <label className="block text-xs font-semibold text-slate-300 mb-1">
            Confirm Password
          </label>
          <div className="relative">
            <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type={showPassword ? 'text' : 'password'}
              value={confirmPassword}
              onChange={(e) => {
                setConfirmPassword(e.target.value);
                if (fieldErrors.confirmPassword)
                  setFieldErrors((prev) => ({ ...prev, confirmPassword: undefined }));
              }}
              placeholder="••••••••••••"
              className={`w-full bg-slate-950 border rounded-xl pl-10 pr-4 py-2 text-xs text-slate-100 placeholder-slate-500 focus:outline-none transition-all font-mono ${
                fieldErrors.confirmPassword
                  ? 'border-rose-500/80 focus:border-rose-500'
                  : 'border-slate-800 focus:border-sky-500'
              }`}
            />
          </div>
          {fieldErrors.confirmPassword && (
            <p className="text-[11px] text-rose-400 mt-1 pl-1 font-medium">
              {fieldErrors.confirmPassword}
            </p>
          )}
        </div>

        {/* Create Account Submit Button */}
        <button
          type="submit"
          disabled={isLoading}
          className="w-full py-2.5 bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-400 hover:to-blue-500 active:scale-[0.99] disabled:opacity-50 text-white rounded-xl text-xs font-bold transition-all shadow-lg shadow-sky-500/20 flex items-center justify-center gap-2 mt-1"
        >
          {isLoading ? (
            <>
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              <span>Creating Account...</span>
            </>
          ) : (
            <>
              <UserPlus className="w-4 h-4" />
              <span>Create Account</span>
            </>
          )}
        </button>

      </form>

      {/* Social Logins */}
      <div className="space-y-2 pt-1">
        <button
          type="button"
          onClick={handleGoogleSignup}
          disabled={googleLoading}
          className="w-full py-2 bg-slate-950 hover:bg-slate-900 border border-slate-800 rounded-xl text-xs font-semibold text-slate-200 transition-all flex items-center justify-center gap-2 shadow-sm active:scale-[0.99] disabled:opacity-50"
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
          onClick={handleGithubSignup}
          disabled={githubLoading}
          className="w-full py-2 bg-slate-950 hover:bg-slate-900 border border-slate-800 rounded-xl text-xs font-semibold text-slate-200 transition-all flex items-center justify-center gap-2 shadow-sm active:scale-[0.99] disabled:opacity-50"
        >
          {githubLoading ? (
            <div className="w-4 h-4 border-2 border-slate-400/30 border-t-slate-200 rounded-full animate-spin" />
          ) : (
            <Github className="w-4 h-4 text-slate-100" />
          )}
          <span>Continue with GitHub</span>
        </button>
      </div>

      {/* Switch to Login */}
      <div className="text-center pt-1">
        <p className="text-xs text-slate-400">
          Already have an account?{' '}
          <button
            type="button"
            onClick={onSwitchToLogin}
            className="text-sky-400 hover:text-sky-300 font-bold hover:underline transition-colors ml-0.5"
          >
            Login
          </button>
        </p>
      </div>

    </div>
  );
};
