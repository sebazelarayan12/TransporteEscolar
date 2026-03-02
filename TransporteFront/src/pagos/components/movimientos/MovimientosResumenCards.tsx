import { formatCurrency } from '../../../shared/utils/currency.helpers';

interface MovimientosResumenCardsProps {
  totalMonto: number;
  totalMovimientos: number;
  breakdown: Record<string, number>;
}

const RESUMEN_MEDIOS = ['Efectivo', 'Transferencia', 'Cheque'] as const;

export const MovimientosResumenCards = ({ totalMonto, totalMovimientos, breakdown }: MovimientosResumenCardsProps) => (
  <section className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
    <div className="rounded-3xl border border-[#e1e8ec] bg-white p-5 shadow-sm dark:border-white/5 dark:bg-[#1f1f24]">
      <p className="text-xs uppercase tracking-wide text-gray-500">Total transaccionado</p>
      <p className="mt-2 text-3xl font-bold text-[#0f181a] dark:text-white">{formatCurrency(totalMonto)}</p>
      <p className="text-xs text-gray-500">Últimos {totalMovimientos} movimientos</p>
    </div>
    <div className="rounded-3xl border border-[#e1e8ec] bg-white p-5 shadow-sm dark:border-white/5 dark:bg-[#1f1f24]">
      <p className="text-xs uppercase tracking-wide text-gray-500">Cantidad de movimientos</p>
      <p className="mt-2 text-3xl font-bold text-[#0f181a] dark:text-white">{totalMovimientos}</p>
      <p className="text-xs text-gray-500">Coinciden con los filtros aplicados</p>
    </div>
    {RESUMEN_MEDIOS.map((medio) => (
      <div key={medio} className="rounded-3xl border border-[#e1e8ec] bg-white p-5 shadow-sm dark:border-white/5 dark:bg-[#1f1f24]">
        <p className="text-xs uppercase tracking-wide text-gray-500">{medio}</p>
        <p className="mt-2 text-2xl font-semibold text-[#0f181a] dark:text-white">{formatCurrency(breakdown[medio] ?? 0)}</p>
        <p className="text-xs text-gray-500">{breakdown[medio] ? 'Registrado' : 'Sin registros'}</p>
      </div>
    ))}
  </section>
);
