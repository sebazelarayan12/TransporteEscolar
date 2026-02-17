import { formatCurrency } from '../../shared/utils/currency.helpers';
import { formatDateOnly } from '../../shared/utils/date.helpers';
import { INGRESO_TIPOS, type IngresoItem } from '../types/ingresos.types';

const categoriaIconMap: Record<string, string> = {
  Convenios: 'handshake',
  Subsidios: 'account_balance',
  Patrocinios: 'workspace_premium',
  Publicidad: 'campaign',
  Eventos: 'event_available',
  VentaMateriales: 'storefront',
  AportesFamilias: 'diversity_3',
  Bonos: 'loyalty',
  Otros: 'redeem',
};

const estadoStyles: Record<string, { bg: string; text: string }> = {
  Cobrado: { bg: 'bg-emerald-50 dark:bg-emerald-400/10', text: 'text-emerald-700 dark:text-emerald-300' },
  Pendiente: { bg: 'bg-amber-50 dark:bg-amber-400/10', text: 'text-amber-700 dark:text-amber-300' },
  Programado: { bg: 'bg-blue-50 dark:bg-blue-400/10', text: 'text-blue-700 dark:text-blue-300' },
};

interface IngresoCardProps {
  ingreso: IngresoItem;
}

export const IngresoCard = ({ ingreso }: IngresoCardProps) => {
  const icon = categoriaIconMap[ingreso.categoria] ?? 'payments';
  const isFijo = ingreso.tipo === INGRESO_TIPOS.FIJO;
  const estadoStyle = estadoStyles[ingreso.estadoCobro] ?? {
    bg: 'bg-slate-100 dark:bg-white/10',
    text: 'text-slate-700 dark:text-slate-200',
  };
  const fijoBadgeStyle = {
    bg: 'bg-indigo-50 dark:bg-indigo-400/10',
    text: 'text-indigo-700 dark:text-indigo-200',
  };

  return (
    <article className="flex w-full flex-col gap-4 rounded-2xl border border-gray-200 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md dark:border-[#3f3f46] dark:bg-[#1f1f24]">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex size-11 items-center justify-center rounded-2xl bg-teal-600/10 text-teal-700 dark:bg-cyan-500/10 dark:text-cyan-200">
            <span className="material-symbols-outlined text-2xl">{icon}</span>
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-900 dark:text-white">{ingreso.categoria}</p>
            <p className="text-xs text-gray-500 break-words">{ingreso.descripcion}</p>
          </div>
        </div>
        <div className="flex flex-col items-end gap-1">
          <span
            className={`inline-flex items-center justify-center rounded-full px-3 py-1 text-xs font-semibold ${
              (isFijo ? fijoBadgeStyle : estadoStyle).bg
            } ${(isFijo ? fijoBadgeStyle : estadoStyle).text}`}
          >
            {isFijo ? 'Ingreso fijo' : ingreso.estadoCobro}
          </span>
          <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-600 dark:bg-white/10 dark:text-slate-200">
            <span className="material-symbols-outlined text-[14px]">account_balance_wallet</span>
            {ingreso.medioCobro}
          </span>
        </div>
      </header>

      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs text-gray-500">{isFijo ? 'Aplicación' : 'Fecha de cobro'}</p>
          <p className="text-sm font-semibold text-gray-900 dark:text-white">
            {formatDateOnly(ingreso.fecha, { day: '2-digit', month: 'long' })}
          </p>
        </div>
        <div className="text-right">
          <p className="text-xs uppercase tracking-widest text-gray-500">Importe</p>
          <p className="text-2xl font-bold text-[#0b2e33] dark:text-white">{formatCurrency(ingreso.monto)}</p>
        </div>
      </div>

      {ingreso.observaciones ? (
        <p className="rounded-xl bg-slate-50 px-3 py-2 text-xs text-gray-600 dark:bg-white/5 dark:text-gray-300">
          {ingreso.observaciones}
        </p>
      ) : null}
    </article>
  );
};
