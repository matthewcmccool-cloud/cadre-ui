'use client';

import {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  useRef,
  type ReactNode,
} from 'react';

interface Toast {
  id: string;
  type: 'success' | 'error';
  message: string;
  exiting?: boolean;
}

interface ToastContextValue {
  toast: (opts: { type: 'success' | 'error'; message: string }) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

let toastId = 0;

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const timersRef = useRef<Map<string, NodeJS.Timeout>>(new Map());

  const dismiss = useCallback((id: string) => {
    // Start exit animation
    setToasts((prev) => prev.map((t) => (t.id === id ? { ...t, exiting: true } : t)));
    // Remove after animation
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 200);
  }, []);

  const toast = useCallback(
    ({ type, message }: { type: 'success' | 'error'; message: string }) => {
      const id = `toast-${++toastId}`;
      setToasts((prev) => [...prev, { id, type, message }]);

      const duration = type === 'error' ? 5000 : 3000;
      const timer = setTimeout(() => dismiss(id), duration);
      timersRef.current.set(id, timer);
    },
    [dismiss]
  );

  // Cleanup timers on unmount
  useEffect(() => {
    return () => {
      timersRef.current.forEach((timer) => clearTimeout(timer));
    };
  }, []);

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}

      {/* Toast container */}
      {toasts.length > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex flex-col gap-2 items-center">
          {toasts.map((t) => (
            <div
              key={t.id}
              className={`flex items-center gap-2.5 bg-zinc-800 border border-zinc-700 rounded-lg shadow-lg px-4 py-3 text-sm text-zinc-100 transition-all duration-200 ${
                t.exiting
                  ? 'opacity-0 translate-y-2'
                  : 'opacity-100 translate-y-0 animate-toast-in'
              }`}
            >
              {t.type === 'success' ? (
                <span className="text-emerald-400 flex-shrink-0">✓</span>
              ) : (
                <span className="text-red-400 flex-shrink-0">✕</span>
              )}
              <span>{t.message}</span>
            </div>
          ))}
        </div>
      )}
    </ToastContext.Provider>
  );
}

export function useToast(): ToastContextValue {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}
