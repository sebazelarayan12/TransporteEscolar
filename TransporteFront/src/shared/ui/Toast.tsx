import { useEffect, useState } from 'react';
import type { Toast as ToastType, ToastVariant } from '../types/toast.types';

interface ToastProps {
  toast: ToastType;
  onDismiss: (id: string) => void;
}

const VARIANT_STYLES: Record<ToastVariant, { bg: string; border: string; icon: string }> = {
  success: {
    bg: 'bg-green-500',
    border: 'border-green-50',
    icon: 'check_circle',
  },
  error: {
    bg: 'bg-red-500',
    border: 'border-red-50',
    icon: 'error',
  },
  info: {
    bg: 'bg-blue-500',
    border: 'border-blue-50',
    icon: 'info',
  },
  warning: {
    bg: 'bg-amber-500',
    border: 'border-amber-50',
    icon: 'warning',
  },
};

export const Toast = ({ toast, onDismiss }: ToastProps) => {
  const [isExiting, setIsExiting] = useState(false);
  const styles = VARIANT_STYLES[toast.variant];
  const duration = toast.duration ?? 4000;

  const handleDismiss = () => {
    setIsExiting(true);
    setTimeout(() => {
      onDismiss(toast.id);
    }, 300);
  };

  useEffect(() => {
    if (duration <= 0) return;

    const timer = setTimeout(() => {
      setIsExiting(true);
      setTimeout(() => {
        onDismiss(toast.id);
      }, 300);
    }, duration);

    return () => clearTimeout(timer);
  }, [duration, toast.id, onDismiss]);

  return (
    <div
      className={`
        ${styles.bg} ${styles.border}
        flex items-start gap-3 p-4 rounded-lg border-2 shadow-lg
        text-white
        transition-all duration-300 ease-out
        ${
          isExiting
            ? 'opacity-0 -translate-y-2 scale-95'
            : 'opacity-100 translate-y-0 scale-100 animate-slide-in-down'
        }
      `}
      role="alert"
      aria-live="polite"
      aria-atomic="true"
    >
      {/* Icon */}
      <span className="material-symbols-outlined text-[24px] flex-shrink-0 mt-0.5">
        {styles.icon}
      </span>

      {/* Message */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium leading-relaxed break-words">{toast.message}</p>
      </div>

      {/* Close button */}
      <button
        type="button"
        onClick={handleDismiss}
        className="flex-shrink-0 hover:bg-white/20 rounded p-1 transition-colors -mr-1 -mt-1"
        aria-label="Cerrar notificación"
      >
        <span className="material-symbols-outlined text-[20px]">close</span>
      </button>
    </div>
  );
};
