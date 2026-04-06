/**
 * ConfirmacionPagoModal component
 * Modal for confirming payment details before submission
 */

import { Modal, Button } from '../../../shared/ui';
import { formatCurrency } from '../../../shared/utils/currency.helpers';
import { formatDateTime } from '../../../shared/utils/date.helpers';
import type { MedioPago } from '../../constants/medios-pago.constants';

export interface PagoConfirmacionData {
  pagoId: number;
  titularLabel: string;
  monto: number;
  medioPago: MedioPago;
  observaciones?: string;
  fechaPagoIso: string;
  periodoDestino: string;
}

interface ConfirmacionPagoModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  data: PagoConfirmacionData | null;
  isPending: boolean;
}

export const ConfirmacionPagoModal = ({
  isOpen,
  onClose,
  onConfirm,
  data,
  isPending,
}: ConfirmacionPagoModalProps) => {
  if (!data) {
    return null;
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="¿Querés confirmar el pago?" maxWidth="lg">
      <div className="space-y-6">
        <div className="rounded-3xl border border-gray-200 bg-white/80 p-5 text-sm text-gray-700 dark:border-[#3f3f46] dark:bg-[#1f1f24] dark:text-gray-200">
          <dl className="space-y-3">
            <div className="flex items-start justify-between gap-4">
              <dt className="text-gray-500 dark:text-gray-400">Titular</dt>
              <dd className="text-right font-semibold text-gray-900 dark:text-white">{data.titularLabel}</dd>
            </div>
            <div className="flex items-start justify-between gap-4">
              <dt className="text-gray-500 dark:text-gray-400">Cuota destino</dt>
              <dd className="text-right font-semibold text-gray-900 dark:text-white">{data.periodoDestino}</dd>
            </div>
            <div className="flex items-start justify-between gap-4">
              <dt className="text-gray-500 dark:text-gray-400">Monto</dt>
              <dd className="text-right font-semibold text-gray-900 dark:text-white">{formatCurrency(data.monto)}</dd>
            </div>
            <div className="flex items-start justify-between gap-4">
              <dt className="text-gray-500 dark:text-gray-400">Medio de pago</dt>
              <dd className="text-right font-semibold text-gray-900 dark:text-white">{data.medioPago}</dd>
            </div>
            <div className="flex items-start justify-between gap-4">
              <dt className="text-gray-500 dark:text-gray-400">Fecha de registro</dt>
              <dd className="text-right font-semibold text-gray-900 dark:text-white">
                {formatDateTime(data.fechaPagoIso)}
              </dd>
            </div>
          </dl>
        </div>

        {data.observaciones && (
          <div className="rounded-3xl border border-dashed border-gray-300 bg-white/70 p-4 text-sm text-gray-700 dark:border-[#3f3f46] dark:bg-[#1f1f24] dark:text-gray-200">
            <p className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">Observaciones</p>
            <p className="mt-1 whitespace-pre-line text-sm">{data.observaciones}</p>
          </div>
        )}

        <div className="flex flex-col gap-3 pt-2 sm:flex-row sm:justify-end">
          <Button type="button" variant="ghost" onClick={onClose} disabled={isPending} className="w-full sm:w-auto">
            Volver
          </Button>
          <Button
            type="button"
            onClick={onConfirm}
            disabled={isPending}
            variant="brand"
            className="w-full rounded-full sm:w-auto"
          >
            {isPending ? (
              <span className="flex items-center justify-center gap-2">
                <span className="material-symbols-outlined animate-spin text-[20px] text-white">progress_activity</span>
                Confirmando...
              </span>
            ) : (
              <span className="flex items-center justify-center gap-2">
                <span className="material-symbols-outlined text-[20px]">task_alt</span>
                Confirmar pago
              </span>
            )}
          </Button>
        </div>
      </div>
    </Modal>
  );
};
