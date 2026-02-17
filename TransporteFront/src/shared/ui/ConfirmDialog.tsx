import type { ReactNode } from 'react';
import { Modal } from './Modal';
import { Button } from './Button';
import { Spinner } from './Spinner';

interface ConfirmDialogProps {
  isOpen: boolean;
  title?: string;
  message: ReactNode;
  confirmLabel: string;
  cancelLabel?: string;
  destructive?: boolean;
  isProcessing?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export const ConfirmDialog = ({
  isOpen,
  title = 'Confirmar acción',
  message,
  confirmLabel,
  cancelLabel = 'Cancelar',
  destructive = false,
  isProcessing = false,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) => {
  if (!isOpen) {
    return null;
  }

  const handleClose = () => {
    if (isProcessing) {
      return;
    }
    onCancel();
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title={title} maxWidth="sm">
      <div className="space-y-5 text-sm text-gray-600 dark:text-gray-300">
        <div>{message}</div>
        <div className="flex flex-wrap items-center justify-end gap-3">
          <Button type="button" variant="ghost" disabled={isProcessing} onClick={onCancel} className="text-gray-600 hover:text-gray-900 dark:text-gray-300">
            {cancelLabel}
          </Button>
          <Button
            type="button"
            variant={destructive ? 'danger' : 'brand'}
            disabled={isProcessing}
            onClick={onConfirm}
            className="inline-flex items-center gap-2"
          >
            {isProcessing ? <Spinner size="sm" /> : <span className="material-symbols-outlined text-[18px]">task_alt</span>}
            {confirmLabel}
          </Button>
        </div>
      </div>
    </Modal>
  );
};
