import React, { createContext, useCallback, useContext, useRef, useState } from 'react';
import { CheckCircle2, AlertCircle, X, Info } from 'lucide-react';
import { makeId } from '../lib/utils';

type ToastKind = 'success' | 'error' | 'info';

interface ToastItem {
  id: string;
  kind: ToastKind;
  title: string;
  message?: string;
}

interface ToastApi {
  success: (title: string, message?: string) => void;
  error: (title: string, message?: string) => void;
  info: (title: string, message?: string) => void;
}

const ToastContext = createContext<ToastApi>({
  success: () => {},
  error: () => {},
  info: () => {},
});

export function useToast(): ToastApi {
  return useContext(ToastContext);
}

const KIND_STYLES: Record<
  ToastKind,
  { icon: React.ElementType; accent: string; label: string }
> = {
  success: { icon: CheckCircle2, accent: 'text-app-success', label: 'Success' },
  error: { icon: AlertCircle, accent: 'text-app-danger', label: 'Error' },
  info: { icon: Info, accent: 'text-app-accent', label: 'Info' },
};

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const timers = useRef<Record<string, ReturnType<typeof setTimeout>>>({});

  const dismiss = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
    if (timers.current[id]) {
      clearTimeout(timers.current[id]);
      delete timers.current[id];
    }
  }, []);

  const push = useCallback(
    (kind: ToastKind, title: string, message?: string) => {
      const id = makeId();
      setToasts((prev) => [...prev.slice(-3), { id, kind, title, message }]);
      timers.current[id] = setTimeout(() => dismiss(id), 5000);
    },
    [dismiss],
  );

  const api = React.useMemo<ToastApi>(
    () => ({
      success: (title, message) => push('success', title, message),
      error: (title, message) => push('error', title, message),
      info: (title, message) => push('info', title, message),
    }),
    [push],
  );

  return (
    <ToastContext.Provider value={api}>
      {children}
      <div
        aria-live="polite"
        aria-label="Notifications"
        className="fixed z-[100] bottom-4 right-4 left-4 sm:left-auto sm:w-96 flex flex-col gap-2 pointer-events-none"
      >
        {toasts.map((toast) => {
          const style = KIND_STYLES[toast.kind];
          const Icon = style.icon;
          return (
            <div
              key={toast.id}
              role="status"
              className="pointer-events-auto card p-3.5 flex items-start gap-3 shadow-app-lg animate-[fade-slide-in_0.18s_ease]"
            >
              <Icon className={`w-5 h-5 shrink-0 mt-0.5 ${style.accent}`} aria-hidden="true" />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-app-foreground">{toast.title}</p>
                {toast.message && (
                  <p className="text-xs text-app-muted mt-0.5 leading-relaxed">{toast.message}</p>
                )}
              </div>
              <button
                type="button"
                onClick={() => dismiss(toast.id)}
                aria-label="Dismiss notification"
                className="btn-ghost btn p-1 -m-1 shrink-0 rounded-md"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
};
