import { ConfirmDialog } from '../../shared/ui';

export type DeleteDialogCopy = {
  title: string;
  message: string;
  confirmLabel: string;
};

export type GastosDeleteDialogProps = {
  isOpen: boolean;
  copy: DeleteDialogCopy | null;
  isProcessing: boolean;
  onConfirm: () => void;
  onCancel: () => void;
};

export const GastosDeleteDialog = ({ isOpen, copy, isProcessing, onConfirm, onCancel }: GastosDeleteDialogProps) => (
  <ConfirmDialog
    isOpen={isOpen}
    title={copy?.title}
    message={copy?.message ?? ''}
    confirmLabel={copy?.confirmLabel ?? 'Eliminar'}
    destructive
    isProcessing={isProcessing}
    onConfirm={onConfirm}
    onCancel={onCancel}
  />
);
