/**
 * ResumenTitular component
 * Displays financial summary for selected titular using priority balance logic
 */

import type { TitularResponse } from '../../../titulares/types/titular.types';
import type { PagoMensual } from '../../types/pago.types';
import { useSaldoPrioritario } from '../../hooks/useSaldoPrioritario';
import { formatCurrency } from '../../../shared/utils/currency.helpers';

interface ResumenTitularProps {
  titular: TitularResponse | null;
  pagosTitular: PagoMensual[] | undefined;
  isLoading: boolean;
  isFetching: boolean;
}

export const ResumenTitular = ({ titular, pagosTitular, isLoading, isFetching }: ResumenTitularProps) => {
  const saldoInfo = useSaldoPrioritario(pagosTitular);

  if (!titular) {
    return (
      <p className="text-sm text-gray-500 dark:text-gray-400">
        Seleccioná un titular para consultar sus cuotas pendientes y registrar un pago manual.
      </p>
    );
  }

  if (isLoading || isFetching) {
    return (
      <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
        <span className="material-symbols-outlined animate-spin text-[20px] text-[#1d8ca5]">progress_activity</span>
        Cargando cuotas generadas...
      </div>
    );
  }

  const tieneCuotas = (pagosTitular?.length ?? 0) > 0;

  if (!tieneCuotas) {
    return (
      <p className="text-sm text-gray-500 dark:text-gray-400">
        Este titular todavía no tiene cuotas generadas. Generá las cuotas antes de registrar un pago.
      </p>
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <div className="rounded-2xl border border-gray-200 bg-white p-4 dark:border-[#3f3f46] dark:bg-[#1f1f24]">
        <p className="text-xs uppercase tracking-wide text-gray-400">Cuota mensual</p>
        <p className="mt-1 text-xl font-semibold text-gray-900 dark:text-white">
          {formatCurrency(titular.montoMensualPactado)}
        </p>
      </div>
      <div className="rounded-2xl border border-gray-200 bg-white p-4 dark:border-[#3f3f46] dark:bg-[#1f1f24]">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-wide text-gray-400">Saldo prioritario</p>
            <p className={`mt-1 text-xl font-semibold ${saldoInfo.colorClass}`}>{saldoInfo.label}</p>
          </div>
          <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${saldoInfo.badge.className}`}>
            {saldoInfo.badge.label}
          </span>
        </div>
        <p className="mt-3 text-xs uppercase tracking-wide text-gray-400">Período</p>
        <p className="mt-1 text-sm font-semibold text-gray-900 dark:text-white">{saldoInfo.periodo}</p>
      </div>
      <div className="rounded-2xl border border-gray-200 bg-white p-4 dark:border-[#3f3f46] dark:bg-[#1f1f24]">
        <p className="text-xs uppercase tracking-wide text-gray-400">Cuotas con deuda</p>
        <p className="mt-1 text-xl font-semibold text-gray-900 dark:text-white">{saldoInfo.cuotasConDeuda.length}</p>
      </div>
      <div className="rounded-2xl border border-gray-200 bg-white p-4 dark:border-[#3f3f46] dark:bg-[#1f1f24]">
        <p className="text-xs uppercase tracking-wide text-gray-400">Próximo vencimiento</p>
        <p className="mt-1 text-base font-semibold text-gray-900 dark:text-white">
          {saldoInfo.proximoVencimientoLabel}
        </p>
      </div>
    </div>
  );
};
