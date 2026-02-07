import { useState } from 'react';
import type { ReactNode } from 'react';
import { ToastContext } from '../hooks/useToast';
import { Toast } from './Toast';
import type { Toast as ToastType, ToastVariant, ToastContextValue } from '../types/toast.types';

interface ToastProviderProps {
  children: ReactNode;
}

const MAX_VISIBLE_TOASTS = 3;

export const ToastProvider = ({ children }: ToastProviderProps) => {
  const [toasts, setToasts] = useState<ToastType[]>([]);

  const addToast = (message: string, variant: ToastVariant, duration: number = 4000) => {
    const id = `toast-${Date.now()}-${Math.random()}`;
    const newToast: ToastType = {
      id,
      message,
      variant,
      duration,
    };

    setToasts((prev) => [...prev, newToast]);
  };

  const dismiss = (id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  };

  const showSuccess = (message: string, duration?: number) => {
    addToast(message, 'success', duration);
  };

  const showError = (message: string, duration?: number) => {
    addToast(message, 'error', duration);
  };

  const showInfo = (message: string, duration?: number) => {
    addToast(message, 'info', duration);
  };

  const showWarning = (message: string, duration?: number) => {
    addToast(message, 'warning', duration);
  };

  const contextValue: ToastContextValue = {
    toasts,
    showSuccess,
    showError,
    showInfo,
    showWarning,
    dismiss,
  };

  // Mostrar solo los últimos MAX_VISIBLE_TOASTS
  const visibleToasts = toasts.slice(-MAX_VISIBLE_TOASTS);

  return (
    <ToastContext.Provider value={contextValue}>
      {children}

      {/* Toast Container */}
      {visibleToasts.length > 0 && (
        <div
          className="fixed inset-x-4 top-4 z-50 flex flex-col gap-3 pointer-events-none items-stretch sm:items-end"
          aria-live="polite"
          aria-atomic="false"
        >
          {visibleToasts.map((toast) => (
            <div key={toast.id} className="pointer-events-auto w-full sm:max-w-md">
              <Toast toast={toast} onDismiss={dismiss} />
            </div>
          ))}
        </div>
      )}
    </ToastContext.Provider>
  );
};
