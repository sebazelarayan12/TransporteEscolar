import { Modal, Spinner, ErrorState, EmptyState } from '../../shared/ui';
import { usePagoDetalle } from '../services/pagos.queries';
import { formatCurrency } from '../../shared/utils/currency.helpers';

interface PagoDetalleModalProps {
  isOpen: boolean;
  onClose: () => void;
  pagoId: number | null;
}

const MEDIO_PAGO_ICONS: Record<string, string> = {
  Efectivo: 'payments',
  Transferencia: 'account_balance',
  Cheque: 'receipt_long',
  Débito: 'credit_card',
  Crédito: 'credit_card',
} as const;

const getMedioPagoIcon = (medioPago: string): string => {
  return MEDIO_PAGO_ICONS[medioPago] ?? 'payments';
};

const formatFechaPago = (fechaISO: string): string => {
  // Parse YYYY-MM-DD without timezone conversion
  const [year, month, day] = fechaISO.split('T')[0].split('-').map(Number);
  const date = new Date(year, month - 1, day);
  return date.toLocaleDateString('es-AR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
};

export const PagoDetalleModal = ({ isOpen, onClose, pagoId }: PagoDetalleModalProps) => {
  const { data: pago, isLoading, isError, error } = usePagoDetalle(pagoId);

  if (!isOpen) return null;

  const renderContent = () => {
    if (isLoading) {
      return (
        <div className="flex items-center justify-center py-12">
          <Spinner size="lg" />
        </div>
      );
    }

    if (isError) {
      return (
        <ErrorState
          message={error instanceof Error ? error.message : 'No se pudo cargar el detalle del pago'}
        />
      );
    }

    if (!pago) {
      return <EmptyState message="No se encontró el pago solicitado" />;
    }

    const hasMovimientos = pago.movimientos && pago.movimientos.length > 0;

    return (
      <div className="space-y-6">
        {/* Cabecera: Titular + Período */}
        <div className="border-b border-gray-200 pb-4 dark:border-gray-700">
          <h3 className="text-xl font-bold text-[#0f181a] dark:text-white">
            {pago.titularApellido}
            {pago.titularNombre ? ` ${pago.titularNombre}` : ''}
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">{pago.periodo}</p>
          {pago.titularDireccion ? (
            <p className="text-xs text-gray-500 dark:text-gray-500">{pago.titularDireccion}</p>
          ) : null}
        </div>

        {/* KPIs: Monto generado, Total pagado, Saldo pendiente */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="rounded-xl border border-gray-200 bg-gray-50 p-4 dark:border-gray-700 dark:bg-[#27272a]">
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
              Monto Generado
            </p>
            <p className="mt-1 text-2xl font-bold text-[#0f181a] dark:text-white">
              {formatCurrency(pago.montoGenerado)}
            </p>
          </div>
          <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 dark:border-emerald-900/30 dark:bg-emerald-900/10">
            <p className="text-xs font-semibold uppercase tracking-wide text-emerald-700 dark:text-emerald-400">
              Total Pagado
            </p>
            <p className="mt-1 text-2xl font-bold text-emerald-600 dark:text-emerald-300">
              {formatCurrency(pago.totalPagado)}
            </p>
          </div>
          <div
            className={`rounded-xl border p-4 ${
              pago.saldoPendiente > 0
                ? 'border-rose-200 bg-rose-50 dark:border-rose-900/30 dark:bg-rose-900/10'
                : 'border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-[#27272a]'
            }`}
          >
            <p
              className={`text-xs font-semibold uppercase tracking-wide ${
                pago.saldoPendiente > 0
                  ? 'text-rose-700 dark:text-rose-400'
                  : 'text-gray-500 dark:text-gray-400'
              }`}
            >
              Saldo Pendiente
            </p>
            <p
              className={`mt-1 text-2xl font-bold ${
                pago.saldoPendiente > 0
                  ? 'text-rose-600 dark:text-rose-300'
                  : 'text-gray-400 dark:text-gray-500'
              }`}
            >
              {formatCurrency(pago.saldoPendiente)}
            </p>
          </div>
        </div>

        {/* Sección Movimientos */}
        <div>
          <h4 className="mb-3 flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-gray-700 dark:text-gray-300">
            <span className="material-symbols-outlined text-[18px]">history</span>
            Movimientos Registrados
          </h4>

          {!hasMovimientos ? (
            <div className="rounded-xl border border-dashed border-gray-300 bg-gray-50 p-8 text-center dark:border-gray-700 dark:bg-[#27272a]">
              <span className="material-symbols-outlined text-4xl text-gray-300 dark:text-gray-600">
                receipt_long_off
              </span>
              <p className="mt-2 text-sm font-medium text-gray-600 dark:text-gray-400">
                No se registraron pagos aún
              </p>
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-500">
                Cuando se registre un pago, aparecerá aquí con su fecha, monto y medio de pago.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {pago.movimientos.map((movimiento) => (
                <div
                  key={movimiento.id}
                  className="flex items-start justify-between gap-4 rounded-xl border border-gray-200 bg-white p-4 shadow-sm transition-shadow hover:shadow-md dark:border-white/5 dark:bg-[#1f1f24]"
                >
                  <div className="flex items-start gap-3">
                    <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-[#007a8a]/10 dark:bg-[#007a8a]/20">
                      <span className="material-symbols-outlined text-[20px] text-[#007a8a]">
                        {getMedioPagoIcon(movimiento.medioPago)}
                      </span>
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-gray-900 dark:text-white">
                        {movimiento.medioPago}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {formatFechaPago(movimiento.fechaPago)}
                      </p>
                      {movimiento.observaciones ? (
                        <p className="mt-1 text-xs italic text-gray-600 dark:text-gray-400">
                          {movimiento.observaciones}
                        </p>
                      ) : null}
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold text-emerald-600 dark:text-emerald-400">
                      {formatCurrency(movimiento.monto)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Observaciones generales del pago mensual */}
        {pago.observaciones ? (
          <div className="rounded-xl border border-blue-200 bg-blue-50 p-4 dark:border-blue-900/30 dark:bg-blue-900/10">
            <p className="text-xs font-semibold uppercase tracking-wide text-blue-700 dark:text-blue-400">
              Observaciones
            </p>
            <p className="mt-1 text-sm text-blue-900 dark:text-blue-200">{pago.observaciones}</p>
          </div>
        ) : null}
      </div>
    );
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Detalle del Pago"
      maxWidth="2xl"
    >
      {renderContent()}
    </Modal>
  );
};
