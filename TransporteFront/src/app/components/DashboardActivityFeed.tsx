import { Link } from 'react-router-dom';
import { Spinner } from '../../shared/ui/Spinner';
import { formatCurrency } from '../../shared/utils/currency.helpers';
import type { DashboardActivityItem } from '../types/dashboard.types';
import { getTitularApellidoDisplay } from '../../shared/utils/titulares.helpers';

interface DashboardActivityFeedProps {
  activityItems: DashboardActivityItem[];
  isLoading: boolean;
}

const formatFechaCorta = (iso: string) =>
  new Date(iso).toLocaleString('es-AR', { dateStyle: 'short', timeStyle: 'short' });

const getInitialsFromDisplay = (display: string) => {
  const parts = display.split(/\s+/).filter(Boolean);
  const first = parts[0]?.charAt(0) ?? '';
  const second = parts[1]?.charAt(0) ?? '';
  const initials = `${first}${second}`.toUpperCase();
  return initials || '--';
};

export const DashboardActivityFeed = ({ activityItems, isLoading }: DashboardActivityFeedProps) => {
  const showActivitySpinner = isLoading && activityItems.length === 0;

  return (
    <section className="pb-8">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-lg font-bold text-[#0f181a] dark:text-white">Actividad reciente</h3>
        <Link to="/pagos" className="text-sm font-semibold text-[#1d8ca5] hover:underline">
          Ver todo
        </Link>
      </div>
      <div className="rounded-3xl border border-[#e1e8ec] bg-white p-3 shadow-sm dark:border-white/5 dark:bg-[#1f1f24]">
        {showActivitySpinner && (
          <div className="flex items-center justify-center py-8">
            <Spinner />
          </div>
        )}
        {!showActivitySpinner &&
          activityItems.map((item, index) => {
            const titularDisplay = getTitularApellidoDisplay(item.titularApellido, item.titularNombre);
            const initials = getInitialsFromDisplay(titularDisplay);
            const montoClass = item.saldoPendiente <= 0 ? 'text-emerald-500' : 'text-gray-500 dark:text-gray-400';
            return (
              <div key={`${item.movimientoId}-${item.titularId}`}>
                <div className="flex items-center gap-4 rounded-2xl p-3 transition hover:bg-gray-50 dark:hover:bg-white/5">
                  <div className="h-14 w-14 flex-shrink-0 rounded-2xl bg-gray-100 text-gray-600 dark:bg-white/10 dark:text-white flex items-center justify-center text-lg font-bold">
                    {initials}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-bold text-[#0f181a] dark:text-white truncate">{titularDisplay}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                      Pago {item.periodo} • {item.medioPago}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className={`text-sm font-bold ${montoClass}`}>{formatCurrency(item.monto)}</p>
                    <p className="text-[11px] text-gray-400">{formatFechaCorta(item.fechaPago)}</p>
                  </div>
                </div>
                {index < activityItems.length - 1 && <div className="mx-4 h-px bg-[#e1e8ec] dark:bg-white/5" />}
              </div>
            );
          })}
        {!showActivitySpinner && activityItems.length === 0 && (
          <div className="flex flex-col items-center justify-center gap-2 py-8 text-center text-sm text-gray-500 dark:text-gray-400">
            <span className="material-symbols-outlined text-3xl text-[#1d8ca5]">event_available</span>
            <p>No registramos actividad reciente aún.</p>
          </div>
        )}
      </div>
    </section>
  );
};
