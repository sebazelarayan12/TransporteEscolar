import { formatCurrency } from '../../shared/utils/currency.helpers';
import { formatDateOnly } from '../../shared/utils/date.helpers';
import { INGRESO_TIPOS, type IngresoItem } from '../types/ingresos.types';
import { CardActionsMenu, type CardActionItem } from './CardActionsMenu';

const categoriaIconMap: Record<string, { icon: string; gradient: string }> = {
  Convenios: { icon: 'handshake', gradient: 'from-indigo-500 via-indigo-400 to-sky-400' },
  Subsidios: { icon: 'account_balance', gradient: 'from-emerald-500 via-teal-500 to-cyan-500' },
  Patrocinios: { icon: 'workspace_premium', gradient: 'from-fuchsia-500 via-purple-500 to-pink-500' },
  Publicidad: { icon: 'campaign', gradient: 'from-amber-500 via-orange-500 to-rose-500' },
  Eventos: { icon: 'event_available', gradient: 'from-sky-500 via-blue-500 to-indigo-500' },
  VentaMateriales: { icon: 'storefront', gradient: 'from-lime-500 via-emerald-500 to-teal-500' },
  AportesFamilias: { icon: 'diversity_3', gradient: 'from-rose-500 via-pink-500 to-fuchsia-500' },
  Bonos: { icon: 'loyalty', gradient: 'from-purple-500 via-indigo-500 to-blue-500' },
  Otros: { icon: 'redeem', gradient: 'from-slate-500 via-slate-600 to-slate-700' },
};

const estadoStyles: Record<string, { bg: string; text: string }> = {
  Cobrado: { bg: 'bg-emerald-500/15', text: 'text-emerald-100' },
  Pendiente: { bg: 'bg-amber-500/15', text: 'text-amber-100' },
  Programado: { bg: 'bg-blue-500/15', text: 'text-blue-100' },
};

interface IngresoCardProps {
  ingreso: IngresoItem;
  onEdit?: (ingreso: IngresoItem) => void;
  onDelete?: (ingreso: IngresoItem) => void;
  actionsDisabled?: boolean;
}

export const IngresoCard = ({ ingreso, onEdit, onDelete, actionsDisabled = false }: IngresoCardProps) => {
  const categoriaVisual = categoriaIconMap[ingreso.categoria] ?? {
    icon: 'payments',
    gradient: 'from-slate-500 via-slate-600 to-slate-700',
  };
  const isFijo = ingreso.tipo === INGRESO_TIPOS.FIJO;
  const estadoStyle = estadoStyles[ingreso.estadoCobro] ?? {
    bg: 'bg-slate-500/15',
    text: 'text-slate-200',
  };
  const fijoBadgeStyle = {
    bg: 'bg-indigo-500/15',
    text: 'text-indigo-100',
  };

  const actions: CardActionItem[] = [];
  if (isFijo && onEdit) {
    actions.push({
      id: 'edit',
      label: 'Editar',
      icon: 'edit',
      onSelect: () => onEdit(ingreso),
    });
  }
  if (onDelete) {
    actions.push({
      id: 'delete',
      label: 'Eliminar',
      icon: 'delete',
      onSelect: () => onDelete(ingreso),
      destructive: true,
    });
  }

  return (
    <article className="relative rounded-[24px] border border-slate-200/80 bg-white/90 p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md dark:border-white/10 dark:bg-slate-900/60 sm:p-5 md:pr-16">
      {actions.length > 0 ? (
        <div className="absolute right-4 top-4 hidden md:block">
          <CardActionsMenu items={actions} disabled={actionsDisabled} />
        </div>
      ) : null}
      <div className="flex flex-col gap-3">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-6">
          <div className="flex flex-1 items-center gap-4">
            <div className={`flex size-12 items-center justify-center rounded-2xl bg-gradient-to-br ${categoriaVisual.gradient}`}>
              <span className="material-symbols-rounded text-2xl text-white" aria-hidden>
                {categoriaVisual.icon}
              </span>
            </div>
            <div className="min-w-0">
              <p className="text-[11px] font-semibold uppercase tracking-[0.35em] text-slate-400 dark:text-slate-500">
                {isFijo ? 'Aplicación' : 'Fecha de cobro'} · {ingreso.medioCobro}
              </p>
              <p className="mt-1 break-words text-base font-semibold text-slate-900 dark:text-white">{ingreso.descripcion}</p>
              <p className="text-sm text-slate-500 dark:text-slate-300">{ingreso.categoria}</p>
            </div>
          </div>
          <div className="text-right sm:min-w-[160px]">
            <p className="text-[11px] uppercase tracking-[0.35em] text-slate-400 dark:text-slate-500">Importe</p>
            <p className="text-2xl font-bold leading-tight text-slate-900 dark:text-white">{formatCurrency(ingreso.monto)}</p>
            {actions.length > 0 ? (
              <div className="mt-1 inline-flex md:hidden">
                <CardActionsMenu items={actions} disabled={actionsDisabled} />
              </div>
            ) : null}
          </div>
        </div>
        <div className="flex flex-wrap items-center justify-end gap-2 text-[11px] font-semibold uppercase tracking-widest">
          <span className={`inline-flex items-center rounded-full px-3 py-1 ${(isFijo ? fijoBadgeStyle : estadoStyle).bg} ${(isFijo ? fijoBadgeStyle : estadoStyle).text}`}>
            {isFijo ? 'Ingreso fijo' : ingreso.estadoCobro}
          </span>
          <span className="inline-flex items-center rounded-full bg-slate-100 px-3 py-1 text-slate-600 dark:bg-white/10 dark:text-slate-200">
            {formatDateOnly(ingreso.fecha, { day: '2-digit', month: 'long' })}
          </span>
        </div>
      </div>
      {ingreso.observaciones ? (
        <p className="mt-4 rounded-2xl border border-slate-200/70 bg-slate-50 px-4 py-3 text-sm text-slate-600 dark:border-white/10 dark:bg-white/5 dark:text-slate-200">
          {ingreso.observaciones}
        </p>
      ) : null}
    </article>
  );
};
