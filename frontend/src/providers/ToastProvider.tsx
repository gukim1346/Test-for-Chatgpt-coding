import { createContext, ReactNode, useCallback, useContext, useState } from 'react';
import { createPortal } from 'react-dom';
import clsx from 'clsx';

interface Toast {
  id: number;
  message: string;
  tone?: 'info' | 'success' | 'error';
}

interface ToastContextValue {
  showToast: (toast: Omit<Toast, 'id'>) => void;
}

const ToastContext = createContext<ToastContextValue | undefined>(undefined);

export const ToastProvider = ({ children }: { children: ReactNode }) => {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const showToast = useCallback((toast: Omit<Toast, 'id'>) => {
    setToasts((prev) => {
      const next = [...prev, { ...toast, id: Date.now() }];
      return next.slice(-4);
    });
    setTimeout(() => {
      setToasts((prev) => prev.slice(1));
    }, 4000);
  }, []);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      {createPortal(
        <div className="pointer-events-none fixed right-4 top-4 z-50 flex w-80 flex-col gap-3" role="status" aria-live="polite">
          {toasts.map((toast) => (
            <div
              key={toast.id}
              className={clsx('rounded-md px-4 py-3 text-sm shadow-md', {
                'bg-indigo-600 text-white': toast.tone === 'info',
                'bg-emerald-600 text-white': toast.tone === 'success',
                'bg-rose-600 text-white': toast.tone === 'error',
                'bg-slate-800 text-white': !toast.tone,
              })}
            >
              {toast.message}
            </div>
          ))}
        </div>,
        document.body
      )}
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within ToastProvider');
  }
  return context;
};
