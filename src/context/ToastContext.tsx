import React, { createContext, useContext, useState, useCallback } from 'react';
import CheckCircleIcon from 'lucide-react/dist/esm/icons/check-circle-2';
import AlertCircleIcon from 'lucide-react/dist/esm/icons/alert-circle';

export type ToastType = 'success' | 'error';

export interface ToastMessage {
  id: string;
  message: string;
  type: ToastType;
}

interface ToastContextType {
  showToast: (message: string, type?: ToastType) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toast, setToast] = useState<ToastMessage | null>(null);

  const showToast = useCallback((message: string, type: ToastType = 'success') => {
    const id = Date.now().toString();
    setToast({ id, message, type });

    setTimeout(() => {
      setToast((current) => (current?.id === id ? null : current));
    }, 3500);
  }, []);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      {toast && (
        <div
          role="status"
          aria-live="polite"
          className="fixed bottom-6 right-6 z-50 flex items-center gap-3 px-4 py-3 rounded-lg border border-[var(--border-default)] bg-[var(--bg-surface-elevated)] text-sm font-medium text-[var(--text-primary)] shadow-lg animate-in fade-in slide-in-from-bottom-2 duration-200 max-w-sm"
        >
          {toast.type === 'success' ? (
            <CheckCircleIcon className="w-5 h-5 text-[var(--brand-primary)] shrink-0" />
          ) : (
            <AlertCircleIcon className="w-5 h-5 text-[var(--feedback-error)] shrink-0" />
          )}
          <span className="leading-snug">{toast.message}</span>
        </div>
      )}
    </ToastContext.Provider>
  );
};

export const useToast = (): ToastContextType => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};
