import { formatCurrency } from '../../shared/utils/currency.helpers';
import { formatDateOnly } from '../../shared/utils/date.helpers';
import { CardActionsMenu, type CardActionItem } from './CardActionsMenu';
import { buildUpcomingCuotas } from '../helpers/plan-cuotas.helpers';
import { getCategoriaConfig } from '../constants/categorias.config';
import { GASTO_ESTADOS, GASTO_TIPOS, type GastoEstadoPago, type GastoItem } from '../types/gastos.types';

const estadoStyles: Record<GastoEstadoPago, { bg: string; text: string }> = {
  Pagado: { bg: 'bg-emerald-500/15', text: 'text-emerald-100' },
  Pendiente: { bg: 'bg-amber-500/15', text: 'text-amber-100' },
};

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
  const estadoStyle = estadoStyles[gasto.estadoPago] ?? {
    bg: 'bg-slate-500/15',
    text: 'text-slate-200',
  };
  const fijoBadgeStyle = {
    bg: 'bg-sky-500/15',
    text: 'text-sky-100',
  };
  const badgeStyle = isGastoFijo ? fijoBadgeStyle : estadoStyle;
  const badgeLabel = isGastoFijo ? 'Fijo' : gasto.estadoPago;
  const proximasCuotas = buildUpcomingCuotas({ gasto });
  const showPlanCuotas = Boolean(gasto.esPlanCuotas && proximasCuotas.length > 0);

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
    <article className="rounded-[28px] border border-slate-200/80 bg-white/90 p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md dark:border-white/10 dark:bg-slate-900/60">
      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div className="flex flex-1 items-start gap-4">
            <div className={`flex size-14 items-center justify-center rounded-2xl bg-gradient-to-br ${categoriaConfig.gradient}`}>
              <span className="material-symbols-rounded text-2xl text-white" aria-hidden>
                {categoriaConfig.icon}
              </span>
            </div>
            <div className="min-w-0">
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {formatDateOnly(gasto.fechaCuota, { day: '2-digit', month: 'long' })} · {gasto.medioPago}
              </p>
              <p className="mt-1 text-base font-semibold text-slate-900 dark:text-white break-words">
                {gasto.descripcion}
              </p>
            </div>
          </div>
          <div className="flex items-start gap-2">
            <div className="text-right">
              <p className="text-xs uppercase tracking-[0.35em] text-slate-400 dark:text-slate-500">Monto</p>
              <p className="text-2xl font-bold text-slate-900 dark:text-white">{formatCurrency(gasto.monto)}</p>
              {gasto.numeroCuota && gasto.totalCuotas ? (
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Cuota {gasto.numeroCuota}/{gasto.totalCuotas}
                </p>
              ) : null}
            </div>
            {actions.length > 0 ? <CardActionsMenu items={actions} disabled={actionsDisabled} /> : null}
          </div>
        </div>

        <div className="flex flex-wrap gap-2 text-xs font-semibold">
          <span className={`inline-flex items-center rounded-full px-3 py-1 ${categoriaConfig.chipClass}`}>
            {categoriaConfig.label}
          </span>
          <span className={`inline-flex items-center rounded-full px-3 py-1 ${badgeStyle.bg} ${badgeStyle.text}`}>
            {badgeLabel}
          </span>
          <span className="inline-flex items-center rounded-full bg-slate-100 px-3 py-1 text-slate-600 dark:bg-white/10 dark:text-slate-200">
            {gasto.medioPago}
          </span>
        </div>
      </div>

      {gasto.observaciones ? (
        <p className="mt-4 rounded-2xl border border-slate-200/70 bg-slate-50 px-4 py-3 text-sm text-slate-600 dark:border-white/10 dark:bg-white/5 dark:text-slate-200">
          {gasto.observaciones}
        </p>
      ) : null}

      {showPlanCuotas ? (
        <div className="mt-4 rounded-2xl border border-teal-200/70 bg-teal-50/60 p-4 text-sm text-teal-900 dark:border-teal-500/30 dark:bg-teal-500/10 dark:text-teal-100">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-xs font-semibold uppercase tracking-[0.3em]">Próximas cuotas</p>
            <span className="text-xs font-semibold">
              {gasto.numeroCuota ?? 1}/{gasto.totalCuotas ?? gasto.cantidadCuotas ?? 1}
            </span>
          </div>
          <div className="mt-3 space-y-3">
            {proximasCuotas.map((cuota) => {
              const cuotaBadge = estadoStyles[cuota.estadoPago] ?? estadoStyle;
              return (
                <div
                  key={cuota.numeroCuota}
                  className="flex items-center justify-between gap-4 rounded-2xl border border-white/50 bg-white/70 px-3 py-2 dark:border-white/10 dark:bg-white/5"
                >
                  <div>
                    <p className="text-sm font-semibold text-slate-900 dark:text-white">
                      Cuota {cuota.numeroCuota}/{cuota.totalCuotas}
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-300">
                      {formatDateOnly(cuota.fechaCuota, { day: '2-digit', month: 'short' })}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-slate-900 dark:text-white">
                      {formatCurrency(cuota.montoCuota)}
                    </p>
                    <span className={`mt-1 inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-semibold ${cuotaBadge.bg} ${cuotaBadge.text}`}>
                      {cuota.estadoPago}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : null}
    </article>
  );
};
