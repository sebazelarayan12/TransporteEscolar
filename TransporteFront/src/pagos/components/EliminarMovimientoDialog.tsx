import { Modal, Button } from '../../shared/ui';
import { formatCurrency } from '../../shared/utils/currency.helpers';
import { formatDateTime } from '../../shared/utils/date.helpers';

export interface MovimientoEliminarResumen {
  monto: number;
  medioPago: string;
  fechaPago: string;
  titularLabel?: string;
  periodo?: string;
  observaciones?: string | null;
}

interface EliminarMovimientoDialogProps {
  isOpen: boolean;
  resumen: MovimientoEliminarResumen | null;
  onCancel: () => void;
  onConfirm: () => void;
  isProcessing: boolean;
}

export const EliminarMovimientoDialog = ({
  isOpen,
  resumen,
  onCancel,
  onConfirm,
  isProcessing,
}: EliminarMovimientoDialogProps) => {
  if (!isOpen || !resumen) {
    return null;
  }

  const handleClose = () => {
    if (isProcessing) {
      return;
    }

    onCancel();
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Eliminar movimiento" maxWidth="sm">
      <div className="space-y-5">
        <div className="flex items-start gap-3 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-rose-700 dark:border-rose-900/40 dark:bg-rose-900/20 dark:text-rose-200">
          <span className="material-symbols-outlined text-3xl">warning</span>
          <p className="text-sm leading-relaxed">
            Esta acción eliminará el movimiento seleccionado y recalculará los totales del periodo. No podrás
            recuperarlo luego.
          </p>
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white p-4 text-sm shadow-sm dark:border-white/10 dark:bg-[#1f1f24]">
          <div className="flex items-center justify-between text-gray-600 dark:text-gray-300">
            <span className="font-semibold text-gray-900 dark:text-white">{resumen.medioPago}</span>
            <span className="text-base font-bold text-emerald-600 dark:text-emerald-300">
              {formatCurrency(resumen.monto)}
            </span>
          </div>
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">{formatDateTime(resumen.fechaPago)}</p>
          {resumen.titularLabel ? (
            <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">
              Titular: <span className="font-medium text-gray-900 dark:text-white">{resumen.titularLabel}</span>
            </p>
          ) : null}
          {resumen.periodo ? (
            <p className="text-sm text-gray-600 dark:text-gray-300">
              Periodo: <span className="font-medium text-gray-900 dark:text-white">{resumen.periodo}</span>
            </p>
          ) : null}
          {resumen.observaciones ? (
            <p className="mt-2 rounded-xl bg-gray-50 px-3 py-2 text-xs text-gray-600 dark:bg-white/5 dark:text-gray-300">
              {resumen.observaciones}
            </p>
          ) : null}
        </div>

        <div className="flex items-center justify-end gap-3">
          <Button
            type="button"
            variant="ghost"
            onClick={onCancel}
            disabled={isProcessing}
            className="text-sm font-semibold text-gray-600 hover:text-gray-900 dark:text-gray-300"
          >
            Cancelar
          </Button>
          <Button
            type="button"
            variant="danger"
            onClick={onConfirm}
            disabled={isProcessing}
            className="flex items-center gap-2"
          >
            {isProcessing ? (
              <span className="material-symbols-outlined animate-spin text-[18px]">progress_activity</span>
            ) : (
              <span className="material-symbols-outlined text-[18px]">delete</span>
            )}
            Eliminar
          </Button>
        </div>
      </div>
    </Modal>
  );
};
