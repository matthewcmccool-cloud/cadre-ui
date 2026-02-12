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
import Link from 'next/link';

interface Toast {
  id: string;
  type: 'success' | 'error';
  message: ReactNode;
  undoAction?: () => void;
  exiting?: boolean;
}

interface ToastOpts {
  type: 'success' | 'error';
  message: string;
  /** Optional link text + href shown after the message */
  link?: { text: string; href: string };
  /** Optional undo callback — shows an "Undo" button */
  undoAction?: () => void;
}

interface ToastContextValue {
  toast: (opts: ToastOpts) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

let toastId = 0;

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const timersRef = useRef<Map<string, NodeJS.Timeout>>(new Map());

  const dismiss = useCallback((id: string) => {
    setToasts((prev) => prev.map((t) => (t.id === id ? { ...t, exiting: true } : t)));
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 200);
  }, []);

  const toast = useCallback(
    ({ type, message, link, undoAction }: ToastOpts) => {
      const id = `toast-${++toastId}`;

      const content: ReactNode = (
        <span className="flex items-center gap-2 flex-wrap">
          <span>{message}</span>
          {link && (
            <Link
              href={link.href}
              className="text-purple-400 hover:text-purple-300 transition-colors whitespace-nowrap"
            >
              {link.text}
            </Link>
          )}
        </span>
      );

      setToasts((prev) => [...prev, { id, type, message: content, undoAction }]);

      const duration = type === 'error' ? 5000 : 4000;
      const timer = setTimeout(() => dismiss(id), duration);
      timersRef.current.set(id, timer);
    },
    [dismiss]
  );

  useEffect(() => {
    return () => {
      timersRef.current.forEach((timer) => clearTimeout(timer));
    };
  }, []);

  const handleUndo = useCallback((id: string, action: () => void) => {
    action();
    dismiss(id);
  }, [dismiss]);

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}

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
                <span className="text-emerald-400 flex-shrink-0">&#10003;</span>
              ) : (
                <span className="text-red-400 flex-shrink-0">&#10005;</span>
              )}
              <span>{t.message}</span>
              {t.undoAction && (
                <button
                  onClick={() => handleUndo(t.id, t.undoAction!)}
                  className="text-zinc-400 hover:text-zinc-200 transition-colors text-xs font-medium ml-1 whitespace-nowrap"
                >
                  Undo
                </button>
              )}
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
