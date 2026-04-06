import { Modal, Button, Spinner } from '../../shared/ui';
import { formatCurrency } from '../../shared/utils/currency.helpers';
import { usePrecioPrevioReinscripcion } from '../services/reinscripciones.queries';
import type { ReinscripcionPrecioPrevioResponse } from '../types/reinscripcion.types';
import { DEFAULT_TITULAR_LABEL, getTitularApellidoDisplay } from '../../shared/utils/titulares.helpers';

interface PrecioResumenProps {
  variant: 'confirmar' | 'noContinua';
  isLoading: boolean;
  hasError: boolean;
  precioData: ReinscripcionPrecioPrevioResponse | null | undefined;
  onRetry: () => void;
}

const PrecioResumen = ({ variant, isLoading, hasError, precioData, onRetry }: PrecioResumenProps) => {
  if (variant !== 'confirmar') {
    return null;
  }

  if (isLoading) {
    return (
      <div className="flex flex-col items-center gap-3 py-6 text-center">
        <Spinner />
        <p className="text-sm text-gray-500 dark:text-gray-300">Calculando precio final...</p>
      </div>
    );
  }

  if (hasError) {
    return (
      <div className="rounded-2xl border border-red-200 bg-red-50/70 p-4 text-sm text-red-900 dark:border-red-500/40 dark:bg-red-900/20 dark:text-red-50">
        <p className="font-semibold">No pudimos obtener el precio final.</p>
        <p className="mt-1 text-xs opacity-90">Revisa la conexión e inténtalo nuevamente antes de confirmar.</p>
        <button
          type="button"
          onClick={onRetry}
          className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-[#1d8ca5] hover:text-[#166478]"
        >
          <span className="material-symbols-outlined text-[16px]">refresh</span>
          Reintentar
        </button>
      </div>
    );
  }

  if (!precioData) {
    return null;
  }

  const { montoBase, descuentosAplicados, recargosAplicados, totalCalculado } = precioData;
  const descuentosLabel = descuentosAplicados > 0 ? `- ${formatCurrency(descuentosAplicados)}` : formatCurrency(0);
  const recargosLabel = recargosAplicados > 0 ? `+ ${formatCurrency(recargosAplicados)}` : formatCurrency(0);
  const hayAjustes = descuentosAplicados > 0 || recargosAplicados > 0;

  return (
    <div className="space-y-4">
      <dl className="space-y-3 text-sm text-gray-600 dark:text-gray-100">
        <div className="flex items-center justify-between gap-4">
          <dt className="text-xs uppercase tracking-wide text-gray-500">Monto base</dt>
          <dd className="text-right font-semibold text-gray-900 dark:text-white">{formatCurrency(montoBase)}</dd>
        </div>
        <div className="flex items-center justify-between gap-4">
          <dt className="text-xs uppercase tracking-wide text-gray-500">Descuentos</dt>
          <dd className="text-right font-semibold text-emerald-600 dark:text-emerald-300">{descuentosLabel}</dd>
        </div>
        <div className="flex items-center justify-between gap-4">
          <dt className="text-xs uppercase tracking-wide text-gray-500">Recargos</dt>
          <dd className="text-right font-semibold text-rose-600 dark:text-rose-300">{recargosLabel}</dd>
        </div>
      </dl>
      <div className="rounded-2xl bg-[#0f181a] p-4 text-white dark:bg-white/10 dark:text-white">
        <p className="text-xs uppercase tracking-wide text-white/80">Total a generar</p>
        <p className="mt-2 text-3xl font-bold">{formatCurrency(totalCalculado)}</p>
        <p className="mt-1 text-xs text-white/70">
          Este será el importe usado para crear las cuotas automáticas{hayAjustes ? ', incluyendo los ajustes aplicados.' : '.'}
        </p>
      </div>
    </div>
  );
};

interface LastPendingConfirmationModalProps {
  isOpen: boolean;
  reinscripcionId: number | null;
  onCancel: () => void;
  onConfirm: () => void;
  pasajeroNombre: string;
  titularNombre?: string;
  actionLabel: string;
  isProcessing?: boolean;
  variant?: 'confirmar' | 'noContinua';
  isUltimoPendiente?: boolean;
}

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
  const shouldLoadPrecio = isOpen && variant === 'confirmar';
  const precioQuery = usePrecioPrevioReinscripcion(shouldLoadPrecio ? reinscripcionId : null);
  const precioData = variant === 'confirmar' ? precioQuery.data : null;
  const isPriceLoading = variant === 'confirmar' && precioQuery.isLoading && !precioData;
  const hasPrecioError = variant === 'confirmar' && precioQuery.isError;
  const confirmDisabled =
    isProcessing ||
    (variant === 'confirmar' && (!reinscripcionId || !precioData || hasPrecioError || isPriceLoading));

  const titularDisplay = titularNombre
    ? (() => {
        const label = getTitularApellidoDisplay(undefined, titularNombre);
        return label === DEFAULT_TITULAR_LABEL ? undefined : label;
      })()
    : undefined;

  const actionDescription = variant === 'confirmar'
    ? isUltimoPendiente
      ? 'Esta confirmación cierra las reinscripciones pendientes de este titular y generará automáticamente las cuotas con el valor final calculado.'
      : 'Al confirmar vamos a generar las cuotas del titular usando el precio final calculado para este pasajero.'
    : isUltimoPendiente
      ? 'Es el último pasajero pendiente de la familia. Al marcar que no continúa se liberará el cupo y no se generarán cuotas futuras.'
      : 'Estás por marcar que este titular no continuará, liberando el cupo y deteniendo la planificación automática de cuotas.';

  const confirmLabelContent = isProcessing ? (
    <span className="flex items-center justify-center gap-2">
      <span className="material-symbols-outlined animate-spin text-[20px] text-white">progress_activity</span>
      Procesando...
    </span>
  ) : (
    <span className="flex items-center justify-center gap-2">
      <span className="material-symbols-outlined text-[20px]">verified</span>
      {actionLabel}
    </span>
  );

  return (
    <Modal
      isOpen={isOpen}
      onClose={onCancel}
      title={variant === 'confirmar' ? 'Confirmar reinscripción' : 'Confirmación requerida'}
      maxWidth="lg"
    >
      <div className="space-y-5">
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

        <p className="text-sm text-gray-600 dark:text-gray-300">{actionDescription}</p>

        {variant === 'confirmar' && (
          <div className="rounded-2xl border border-dashed border-gray-200 bg-white/60 p-4 dark:border-white/10 dark:bg-white/5">
            <PrecioResumen
              variant={variant}
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
            {confirmLabelContent}
          </Button>
        </div>
      </div>
    </Modal>
  );
};
