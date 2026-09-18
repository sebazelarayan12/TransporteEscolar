import { useEffect, useMemo, useRef, useState } from 'react';
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
  const containerRef = useRef<HTMLDivElement>(null);

  // Acciones estables: solo dependen de setToasts, así el value del contexto
  // cambia únicamente cuando cambia la lista de toasts.
  const actions = useMemo(() => {
    const addToast = (message: string, variant: ToastVariant, duration: number = 4000) => {
      const id = `toast-${Date.now()}-${Math.random()}`;
      const newToast: ToastType = { id, message, variant, duration };
      setToasts((prev) => [...prev, newToast]);
    };

    return {
      showSuccess: (message: string, duration?: number) => addToast(message, 'success', duration),
      showError: (message: string, duration?: number) => addToast(message, 'error', duration),
      showInfo: (message: string, duration?: number) => addToast(message, 'info', duration),
      showWarning: (message: string, duration?: number) => addToast(message, 'warning', duration),
      dismiss: (id: string) => setToasts((prev) => prev.filter((toast) => toast.id !== id)),
    };
  }, []);

  const contextValue = useMemo<ToastContextValue>(() => ({ toasts, ...actions }), [toasts, actions]);

  // Mostrar solo los últimos MAX_VISIBLE_TOASTS
  const visibleToasts = toasts.slice(-MAX_VISIBLE_TOASTS);
  const hasToasts = visibleToasts.length > 0;

  // El contenedor vive en la top layer (popover) para quedar por encima de los <dialog> modales.
  // Se vuelve a mostrar cuando cambia la lista para volver a quedar arriba de todo.
  useEffect(() => {
    const container = containerRef.current;
    if (!container || typeof container.showPopover !== 'function') return;

    if (container.matches(':popover-open')) {
      container.hidePopover();
    }
    container.showPopover();
  }, [toasts]);

  return (
    <ToastContext.Provider value={contextValue}>
      {children}

      {/* Toast Container */}
      {hasToasts && (
        <div
          ref={containerRef}
          popover="manual"
          className="fixed inset-x-4 bottom-auto top-4 z-50 m-0 flex h-auto w-auto max-w-none flex-col items-stretch gap-3 overflow-visible border-0 bg-transparent p-0 pointer-events-none sm:items-end"
          aria-live="polite"
          aria-atomic="false"
        >
          {visibleToasts.map((toast) => (
            <div key={toast.id} className="pointer-events-auto w-full sm:max-w-md">
              <Toast toast={toast} onDismiss={actions.dismiss} />
            </div>
          ))}
        </div>
      )}
    </ToastContext.Provider>
  );
};
