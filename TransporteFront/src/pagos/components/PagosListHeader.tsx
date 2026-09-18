import { Link } from 'react-router-dom';
import { Button } from '../../shared/ui/Button';

interface PagosListHeaderProps {
  onRegisterPago: () => void;
}

export const PagosListHeader = ({ onRegisterPago }: PagosListHeaderProps) => (
  <header className="rounded-3xl border border-zinc-200 bg-white px-6 py-5 shadow-sm dark:border-white/5 dark:bg-zinc-900">
    <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
      <div>
        <p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-brand-accent">Control mensual</p>
        <h1 className="text-2xl font-bold text-ink dark:text-white">Pagos y Recaudación</h1>
        <p className="text-sm text-gray-500">Seguimiento en tiempo real de vencimientos, saldos y registros manuales.</p>
      </div>
      <div className="flex flex-wrap items-center gap-3">
        <Link
          to="/pagos/movimientos"
          className="inline-flex items-center gap-2 rounded-full border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-700 transition hover:border-brand-accent/60 hover:text-brand-accent"
        >
          <span className="material-symbols-outlined text-[18px]">history</span>
          Ver historial
        </Link>
        <Button
          type="button"
          variant="brand"
          onClick={onRegisterPago}
          className="flex items-center justify-center gap-2 rounded-full px-5 py-2 font-semibold"
        >
          <span className="material-symbols-outlined text-[20px]">payments</span>
          Registrar Pago
        </Button>
      </div>
    </div>
  </header>
);
