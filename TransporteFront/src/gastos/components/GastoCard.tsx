import { formatCurrency } from '../../shared/utils/currency.helpers';
import { formatDateOnly } from '../../shared/utils/date.helpers';
import { CardActionsMenu, type CardActionItem } from './CardActionsMenu';
import { getCategoriaConfig } from '../constants/categorias.config';
import { GASTO_ESTADOS, GASTO_TIPOS, type GastoItem } from '../types/gastos.types';

interface GastoCardProps {
  gasto: GastoItem;
  onEdit?: (gasto: GastoItem) => void;
  onDelete?: (gasto: GastoItem) => void;
  actionsDisabled?: boolean;
  onMarkVariablePaid?: (gasto: GastoItem) => void;
  markPaidDisabled?: boolean;
}

export const GastoCard = ({ gasto, onEdit, onDelete, actionsDisabled = false, onMarkVariablePaid, markPaidDisabled = false }: GastoCardProps) => {
  const isGastoFijo = gasto.tipo === GASTO_TIPOS.FIJO;
  const categoriaConfig = getCategoriaConfig(gasto.categoria);

  const actions: CardActionItem[] = [];
  if (isGastoFijo && onEdit) {
    actions.push({
      id: 'edit',
      label: 'Editar',
      icon: 'edit',
      onSelect: () => onEdit(gasto),
    });
  }
  if (onDelete) {
    actions.push({
      id: 'delete',
      label: 'Eliminar',
      icon: 'delete',
      onSelect: () => onDelete(gasto),
      destructive: true,
    });
  }
  if (!isGastoFijo && gasto.estadoPago === GASTO_ESTADOS.PENDIENTE && onMarkVariablePaid) {
    actions.push({
      id: 'mark-paid',
      label: 'Marcar pagado',
      icon: 'task_alt',
      onSelect: () => onMarkVariablePaid(gasto),
      disabled: markPaidDisabled,
    });
  }

  return (
    <article className="flex items-center justify-between gap-3 rounded-xl border border-slate-200/80 bg-white/90 p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md dark:border-white/10 dark:bg-slate-900/60">
      <div className="flex min-w-0 flex-1 items-center gap-3">
        <div className={`flex size-10 items-center justify-center rounded-full bg-gradient-to-br ${categoriaConfig.gradient}`}>
          <span className="material-symbols-rounded text-lg text-white" aria-hidden>
            {categoriaConfig.icon}
          </span>
        </div>
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-slate-900 dark:text-white">{gasto.descripcion}</p>
          <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
            {formatDateOnly(gasto.fechaCuota, { day: '2-digit', month: 'short' })} · {gasto.medioPago}
          </p>
        </div>
      </div>
      <div className="flex items-center gap-3">
        <div className="text-right">
          <p className="text-base font-semibold text-rose-500 dark:text-rose-300">{formatCurrency(gasto.monto)}</p>
          <span className="mt-1 inline-flex items-center justify-end rounded-full bg-slate-100 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.3em] text-slate-600 dark:bg-white/10 dark:text-slate-200">
            {categoriaConfig.label.toUpperCase()}
          </span>
        </div>
        {actions.length > 0 ? <CardActionsMenu items={actions} disabled={actionsDisabled} /> : null}
      </div>
    </article>
  );
};
