import React, { useEffect, useRef, useState } from 'react';
import { X, KeyRound, Loader2 } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';

interface ForgotPasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultEmail?: string;
}

export const ForgotPasswordModal: React.FC<ForgotPasswordModalProps> = ({
  isOpen,
  onClose,
  defaultEmail = '',
}) => {
  const [email, setEmail] = useState(defaultEmail);
  const [sent, setSent] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const dialogRef = useRef<HTMLDivElement>(null);
  const { resetPassword, getFriendlyErrorMessage } = useAuth();

  useEffect(() => {
    if (isOpen) {
      setEmail(defaultEmail);
      setSent(false);
      setError(null);
      dialogRef.current?.focus();
      const onKey = (e: KeyboardEvent) => {
        if (e.key === 'Escape') onClose();
      };
      document.addEventListener('keydown', onKey);
      return () => document.removeEventListener('keydown', onKey);
    }
  }, [isOpen, defaultEmail, onClose]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !email.includes('@')) return;
    setSending(true);
    setError(null);
    try {
      await resetPassword(email.trim());
      setSent(true);
    } catch (err) {
      setError(getFriendlyErrorMessage(err));
    } finally {
      setSending(false);
    }
  };

  return (
    <div
      role="presentation"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      className="fixed inset-0 z-[90] flex items-center justify-center bg-app-bg-subtle/70 p-4"
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="forgot-title"
        tabIndex={-1}
        className="card w-full max-w-md p-6 shadow-app-lg"
      >
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <span className="w-10 h-10 rounded-xl bg-app-accent-muted text-app-accent flex items-center justify-center">
              <KeyRound className="w-5 h-5" aria-hidden="true" />
            </span>
            <div>
              <h3 id="forgot-title" className="text-base font-semibold text-app-foreground">
                Reset Password
              </h3>
              <p className="text-xs text-app-muted">We'll email you a link to reset your password.</p>
            </div>
          </div>
          <button type="button" onClick={onClose} aria-label="Close dialog" className="btn-ghost btn p-1.5 -m-1.5 rounded-md">
            <X className="w-4 h-4" />
          </button>
        </div>

        {sent ? (
          <div className="mt-6 p-3 rounded-lg bg-app-success-muted border border-app-success/30 text-app-success text-sm">
            If an account exists for <span className="font-mono">{email}</span>, a reset link has been sent.
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <label className="block">
              <span className="field-label">Email Address</span>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (error) setError(null);
                }}
                placeholder="you@example.com"
                className="input font-mono"
              />
            </label>
            {error && (
              <p role="alert" className="text-xs font-medium text-app-danger">
                {error}
              </p>
            )}
            <button type="submit" disabled={sending} className="btn btn-primary w-full">
              {sending ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
                  Sending…
                </>
              ) : (
                'Send Reset Link'
              )}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
