import { Modal } from '../../shared/ui/Modal';
import { Button } from '../../shared/ui/Button';
import { usePrecioPrevioReinscripcion } from '../services/reinscripciones.queries';
import {
  getActionDescription,
  getTitularDisplayOrUndefined,
  type LastPendingVariant,
} from '../helpers/last-pending-modal.helpers';
import { PrecioResumen } from './PrecioResumen';

interface LastPendingConfirmationModalProps {
  isOpen: boolean;
  reinscripcionId: number | null;
  onCancel: () => void;
  onConfirm: () => void;
  pasajeroNombre: string;
  titularNombre?: string;
  actionLabel: string;
  isProcessing?: boolean;
  variant?: LastPendingVariant;
  isUltimoPendiente?: boolean;
}

interface ResumenPasajeroProps {
  variant: LastPendingVariant;
  pasajeroNombre: string;
  titularDisplay?: string;
}

const ResumenPasajero = ({ variant, pasajeroNombre, titularDisplay }: ResumenPasajeroProps) => (
  <div className="rounded-2xl border border-amber-200 bg-amber-50/80 p-4 text-sm text-amber-900 dark:border-amber-500/40 dark:bg-amber-900/20 dark:text-amber-50">
    <p className="font-semibold">{variant === 'confirmar' ? 'Revisión previa' : 'Último pasajero pendiente del titular'}</p>
    <dl className="mt-3 space-y-2 text-amber-800 dark:text-amber-100">
      <div className="flex items-center justify-between gap-4">
        <dt className="text-xs uppercase tracking-wide opacity-80">Pasajero</dt>
        <dd className="text-right font-semibold">{pasajeroNombre}</dd>
      </div>
      {titularDisplay && (
        <div className="flex items-center justify-between gap-4">
          <dt className="text-xs uppercase tracking-wide opacity-80">Titular</dt>
          <dd className="text-right font-semibold">{titularDisplay}</dd>
        </div>
      )}
    </dl>
  </div>
);

const ConfirmLabel = ({ isProcessing, actionLabel }: { isProcessing: boolean; actionLabel: string }) => (
  <span className="flex items-center justify-center gap-2">
    <span className={`material-symbols-outlined text-[20px] ${isProcessing ? 'animate-spin text-white' : ''}`}>
      {isProcessing ? 'progress_activity' : 'verified'}
    </span>
    {isProcessing ? 'Procesando...' : actionLabel}
  </span>
);

export const LastPendingConfirmationModal = ({
  isOpen,
  reinscripcionId,
  onCancel,
  onConfirm,
  pasajeroNombre,
  titularNombre,
  actionLabel,
  isProcessing = false,
  variant = 'confirmar',
  isUltimoPendiente = false,
}: LastPendingConfirmationModalProps) => {
  const isConfirmar = variant === 'confirmar';
  const precioQuery = usePrecioPrevioReinscripcion(isOpen && isConfirmar ? reinscripcionId : null);
  const precioData = isConfirmar ? precioQuery.data : null;
  const isPriceLoading = isConfirmar && precioQuery.isLoading && !precioData;
  const hasPrecioError = isConfirmar && precioQuery.isError;
  const precioListo = Boolean(reinscripcionId) && Boolean(precioData) && !hasPrecioError && !isPriceLoading;
  const confirmDisabled = isProcessing || (isConfirmar && !precioListo);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onCancel}
      title={isConfirmar ? 'Confirmar reinscripción' : 'Confirmación requerida'}
      maxWidth="lg"
    >
      <div className="space-y-5">
        <ResumenPasajero
          variant={variant}
          pasajeroNombre={pasajeroNombre}
          titularDisplay={getTitularDisplayOrUndefined(titularNombre)}
        />

        <p className="text-sm text-gray-600 dark:text-gray-300">{getActionDescription(variant, isUltimoPendiente)}</p>

        {isConfirmar && (
          <div className="rounded-2xl border border-dashed border-gray-200 bg-white/60 p-4 dark:border-white/10 dark:bg-white/5">
            <PrecioResumen
              isLoading={isPriceLoading}
              hasError={hasPrecioError}
              precioData={precioData}
              onRetry={() => {
                void precioQuery.refetch();
              }}
            />
          </div>
        )}

        <div className="flex flex-col gap-3 pt-2 sm:flex-row sm:justify-end">
          <Button type="button" variant="ghost" onClick={onCancel} disabled={isProcessing} className="w-full sm:w-auto">
            Cancelar
          </Button>
          <Button
            type="button"
            variant="brand"
            onClick={onConfirm}
            disabled={confirmDisabled}
            className="w-full rounded-full sm:w-auto"
          >
            <ConfirmLabel isProcessing={isProcessing} actionLabel={actionLabel} />
          </Button>
        </div>
      </div>
    </Modal>
  );
};
