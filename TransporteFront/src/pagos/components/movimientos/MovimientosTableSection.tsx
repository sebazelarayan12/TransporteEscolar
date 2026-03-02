import { Button, EmptyState } from '../../../shared/ui';
import { formatCurrency } from '../../../shared/utils/currency.helpers';
import { formatDateTime } from '../../../shared/utils/date.helpers';
import type { MovimientoHistorial } from '../../types/movimientos.types';

interface MovimientosTableSectionProps {
  movimientos: MovimientoHistorial[];
  isEmpty: boolean;
  onDelete: (movimiento: MovimientoHistorial) => void;
  isProcessingDelete: boolean;
  selectedMovimientoId: number | null;
}

const medioPagoClasses: Record<string, string> = {
  Efectivo: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  Transferencia: 'bg-cyan-100 text-cyan-700 border-cyan-200',
  Cheque: 'bg-amber-100 text-amber-700 border-amber-200',
};

interface MovimientosMedioBadgeProps {
  medioPago: string;
}

const MovimientosMedioBadge = ({ medioPago }: MovimientosMedioBadgeProps) => {
  const baseClasses = medioPagoClasses[medioPago] ?? 'bg-gray-100 text-gray-700 border-gray-200';
  return (
    <span className={`inline-flex items-center gap-1 rounded-full border px-3 py-1 text-xs font-semibold ${baseClasses}`}>
      <span className="material-symbols-outlined text-[16px]">credit_card</span>
      {medioPago}
    </span>
  );
};

export const MovimientosTableSection = ({
  movimientos,
  isEmpty,
  onDelete,
  isProcessingDelete,
  selectedMovimientoId,
}: MovimientosTableSectionProps) => {
  if (isEmpty) {
    return <EmptyState message="No hay movimientos para este criterio" />;
  }

  return (
    <div className="overflow-hidden rounded-3xl border border-[#e1e8ec] bg-white shadow-sm dark:border-white/5 dark:bg-[#1f1f24]">
      <div className="hidden md:block">
        <table className="w-full">
          <thead className="bg-gray-50 dark:bg-[#27272a]">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">Fecha y hora</th>
              <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">Titular</th>
              <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">Periodo</th>
              <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">Medio de pago</th>
              <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">Observaciones</th>
              <th className="px-6 py-3 text-right text-xs font-semibold uppercase tracking-wide text-gray-500">Monto</th>
              <th className="px-6 py-3 text-right text-xs font-semibold uppercase tracking-wide text-gray-500">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
            {movimientos.map((movimiento) => (
              <tr key={movimiento.id}>
                <td className="px-6 py-4 text-sm text-gray-900 dark:text-gray-100">{formatDateTime(movimiento.fechaPago)}</td>
                <td className="px-6 py-4 text-sm text-gray-900 dark:text-gray-100">
                  <p className="font-semibold text-[#0f181a] dark:text-white">{movimiento.titularApellido}</p>
                  <p className="text-xs text-gray-500">{movimiento.titularNombre}</p>
                </td>
                <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-300">{movimiento.periodo}</td>
                <td className="px-6 py-4 text-sm">
                  <MovimientosMedioBadge medioPago={movimiento.medioPago} />
                </td>
                <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-300">
                  {movimiento.observaciones ? movimiento.observaciones : <span className="text-gray-400">—</span>}
                </td>
                <td className="px-6 py-4 text-right text-sm font-semibold text-[#0f181a] dark:text-white">
                  {formatCurrency(movimiento.monto)}
                </td>
                <td className="px-6 py-4 text-right">
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    className="inline-flex items-center gap-1 rounded-full border border-rose-200 bg-rose-50 px-3 py-1 text-xs font-semibold text-rose-600 hover:bg-rose-100 dark:border-rose-900/30 dark:bg-rose-900/10 dark:text-rose-200"
                    onClick={() => onDelete(movimiento)}
                    disabled={isProcessingDelete}
                  >
                    {isProcessingDelete && selectedMovimientoId === movimiento.id ? (
                      <span className="material-symbols-outlined animate-spin text-[16px]">progress_activity</span>
                    ) : (
                      <span className="material-symbols-outlined text-[16px]">delete</span>
                    )}
                    <span>Eliminar</span>
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="divide-y divide-gray-100 dark:divide-gray-800 md:hidden">
        {movimientos.map((movimiento) => (
          <div key={movimiento.id} className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-gray-900 dark:text-white">{movimiento.titularApellido}</p>
                <p className="text-xs text-gray-500">{movimiento.titularNombre}</p>
              </div>
              <MovimientosMedioBadge medioPago={movimiento.medioPago} />
            </div>
            <p className="mt-2 text-xs uppercase tracking-wide text-gray-400">{movimiento.periodo}</p>
            <p className="text-sm text-gray-600 dark:text-gray-300">{formatDateTime(movimiento.fechaPago)}</p>
            <p className="mt-2 text-sm font-semibold text-[#0f181a] dark:text-white">{formatCurrency(movimiento.monto)}</p>
            <p className="mt-1 text-xs text-gray-500">{movimiento.observaciones || 'Sin observaciones'}</p>
            <div className="mt-3 flex justify-end">
              <Button
                type="button"
                size="sm"
                variant="ghost"
                className="inline-flex items-center gap-1 rounded-full border border-rose-200 bg-rose-50 px-3 py-1 text-xs font-semibold text-rose-600 hover:bg-rose-100 dark:border-rose-900/30 dark:bg-rose-900/10 dark:text-rose-200"
                onClick={() => onDelete(movimiento)}
                disabled={isProcessingDelete}
              >
                {isProcessingDelete && selectedMovimientoId === movimiento.id ? (
                  <span className="material-symbols-outlined animate-spin text-[16px]">progress_activity</span>
                ) : (
                  <span className="material-symbols-outlined text-[16px]">delete</span>
                )}
                <span>Eliminar</span>
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
