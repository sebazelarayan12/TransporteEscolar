import { Link } from 'react-router-dom';
import { Button } from '../../../shared/ui';

interface PagosMovimientosHeaderProps {
  onRegistrarPago: () => void;
}

export const PagosMovimientosHeader = ({ onRegistrarPago }: PagosMovimientosHeaderProps) => (
  <header className="rounded-3xl border border-[#e1e8ec] bg-white px-6 py-5 shadow-sm dark:border-white/5 dark:bg-[#1f1f24]">
    <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
      <div>
        <p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-[#1d8ca5]">Control financiero</p>
        <h1 className="text-2xl font-bold text-[#0f181a] dark:text-white">Historial de movimientos</h1>
        <p className="text-sm text-gray-500">
          Registrá, filtrá y exportá todos los movimientos registrados por fecha, titular o medio de pago.
        </p>
      </div>
      <div className="flex flex-wrap items-center gap-3">
        <Link
          to="/pagos"
          className="inline-flex items-center gap-2 rounded-full border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-700 transition hover:border-[#1d8ca5]/60 hover:text-[#1d8ca5]"
        >
          <span className="material-symbols-outlined text-[18px]">arrow_back</span>
          Volver a pagos
        </Link>
        <Button type="button" variant="brand" onClick={onRegistrarPago} className="flex items-center gap-2 rounded-full px-5">
          <span className="material-symbols-outlined text-[20px]">payments</span>
          Registrar pago
        </Button>
      </div>
    </div>
  </header>
);
