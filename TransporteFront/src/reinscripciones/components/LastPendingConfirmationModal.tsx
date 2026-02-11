import { Modal, Button } from '../../shared/ui';

interface LastPendingConfirmationModalProps {
  isOpen: boolean;
  onCancel: () => void;
  onConfirm: () => void;
  pasajeroNombre: string;
  titularNombre?: string;
  actionLabel: string;
  isProcessing?: boolean;
}

export const LastPendingConfirmationModal = ({
  isOpen,
  onCancel,
  onConfirm,
  pasajeroNombre,
  titularNombre,
  actionLabel,
  isProcessing = false,
}: LastPendingConfirmationModalProps) => {
  const confirmLabelContent = isProcessing ? (
    <span className="flex items-center justify-center gap-2">
      <span className="material-symbols-outlined animate-spin text-[20px] text-white">progress_activity</span>
      Procesando...
    </span>
  ) : (
    <span className="flex items-center justify-center gap-2">
      <span className="material-symbols-outlined text-[20px]">warning</span>
      {actionLabel}
    </span>
  );

  return (
    <Modal isOpen={isOpen} onClose={onCancel} title="Confirmación requerida" maxWidth="md">
      <div className="space-y-5">
        <div className="rounded-2xl border border-amber-200 bg-amber-50/80 p-4 text-sm text-amber-900 dark:border-amber-500/40 dark:bg-amber-900/20 dark:text-amber-50">
          <p className="font-semibold">Último pasajero pendiente del titular</p>
          <dl className="mt-3 space-y-2 text-amber-800 dark:text-amber-100">
            <div className="flex items-center justify-between gap-4">
              <dt className="text-xs uppercase tracking-wide opacity-80">Pasajero</dt>
              <dd className="text-right font-semibold">{pasajeroNombre}</dd>
            </div>
            {titularNombre && (
              <div className="flex items-center justify-between gap-4">
                <dt className="text-xs uppercase tracking-wide opacity-80">Titular</dt>
                <dd className="text-right font-semibold">{titularNombre}</dd>
              </div>
            )}
          </dl>
        </div>

        <p className="text-sm text-gray-600 dark:text-gray-300">
          Esta acción generará las cuotas del titular adherido automáticamente, ¿desea continuar?
        </p>

        <div className="flex flex-col gap-3 pt-2 sm:flex-row sm:justify-end">
          <Button type="button" variant="ghost" onClick={onCancel} disabled={isProcessing} className="w-full sm:w-auto">
            Cancelar
          </Button>
          <Button
            type="button"
            variant="brand"
            onClick={onConfirm}
            disabled={isProcessing}
            className="w-full rounded-full sm:w-auto"
          >
            {confirmLabelContent}
          </Button>
        </div>
      </div>
    </Modal>
  );
};
