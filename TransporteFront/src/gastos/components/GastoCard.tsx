import { GASTO_ESTADOS, GASTO_TIPOS, type GastoItem } from '../types/gastos.types';
import { formatCurrency } from '../../shared/utils/currency.helpers';
import { formatDateOnly } from '../../shared/utils/date.helpers';
import { CardActionsMenu, type CardActionItem } from './CardActionsMenu';
import { buildUpcomingCuotas } from '../helpers/plan-cuotas.helpers';

const categoriaIconMap: Record<string, string> = {
  Combustible: 'local_gas_station',
  Mantenimiento: 'build',
  Insumos: 'shopping_bag',
  Peajes: 'toll',
  Extraordinario: 'bolt',
  Sueldos: 'group',
  Servicios: 'bolt',
  Seguros: 'verified_user',
  Alquiler: 'apartment',
  Licencias: 'workspace_premium',
};

const estadoStyles: Record<string, { bg: string; text: string }> = {
  Pagado: { bg: 'bg-emerald-50 dark:bg-emerald-400/10', text: 'text-emerald-700 dark:text-emerald-300' },
  Pendiente: { bg: 'bg-amber-50 dark:bg-amber-400/10', text: 'text-amber-700 dark:text-amber-300' },
  Programado: { bg: 'bg-blue-50 dark:bg-blue-400/10', text: 'text-blue-700 dark:text-blue-300' },
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
  const icon = categoriaIconMap[gasto.categoria] ?? 'receipt_long';
  const isGastoFijo = gasto.tipo === GASTO_TIPOS.FIJO;
  const estadoStyle = estadoStyles[gasto.estadoPago] ?? {
    bg: 'bg-gray-100 dark:bg-white/10',
    text: 'text-gray-600 dark:text-gray-300',
  };
  const fijoBadgeStyle = {
    bg: 'bg-sky-50 dark:bg-sky-400/10',
    text: 'text-sky-700 dark:text-sky-200',
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
    <article className="flex w-full flex-col gap-4 rounded-2xl border border-gray-200 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md dark:border-[#3f3f46] dark:bg-[#1f1f24]">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex min-w-0 flex-1 items-center gap-3">
          <div className="flex size-11 items-center justify-center rounded-2xl bg-teal-600/10 text-teal-700 dark:bg-cyan-500/10 dark:text-cyan-200">
            <span className="material-symbols-outlined text-2xl">{icon}</span>
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-900 dark:text-white">
              {gasto.categoria}
            </p>
            <p className="text-xs text-gray-500 break-words">{gasto.descripcion}</p>
          </div>
        </div>
        <div className="flex w-full items-center justify-between gap-2 sm:w-auto sm:justify-end">
          <span className={`inline-flex flex-1 items-center justify-center rounded-full px-3 py-1 text-xs font-semibold ${badgeStyle.bg} ${badgeStyle.text} sm:flex-none`}>
            {badgeLabel}
          </span>
          {actions.length > 0 ? <CardActionsMenu items={actions} disabled={actionsDisabled} /> : null}
        </div>
      </header>

      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs text-gray-500">Fecha</p>
          <p className="text-sm font-semibold text-gray-900 dark:text-white">
            {formatDateOnly(gasto.fechaCuota, { day: '2-digit', month: 'long' })}
          </p>
          <p className="text-xs text-gray-400">{gasto.medioPago}</p>
        </div>
        <div className="text-right">
          <p className="text-xs uppercase tracking-widest text-gray-500">Monto</p>
          <p className="text-2xl font-bold text-[#0b2e33] dark:text-white">{formatCurrency(gasto.monto)}</p>
        </div>
      </div>

      {gasto.observaciones ? (
        <p className="rounded-xl bg-gray-50 px-3 py-2 text-xs text-gray-600 dark:bg-white/5 dark:text-gray-300">
          {gasto.observaciones}
        </p>
      ) : null}

      {showPlanCuotas ? (
        <div className="rounded-2xl bg-teal-50 p-4 text-sm text-teal-900 dark:bg-cyan-500/10 dark:text-cyan-100">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-xs font-semibold uppercase tracking-widest text-teal-700 dark:text-cyan-200">
              Próximas cuotas
            </p>
            <span className="text-xs font-semibold text-teal-800 dark:text-cyan-100">
              {gasto.numeroCuota ?? 1}/{gasto.totalCuotas ?? gasto.cantidadCuotas ?? 1}
            </span>
          </div>
          <div className="mt-3 space-y-3">
            {proximasCuotas.map((cuota) => {
              const cuotaBadge = estadoStyles[cuota.estadoPago] ?? estadoStyle;
              return (
                <div key={cuota.numeroCuota} className="flex items-center justify-between gap-4 rounded-2xl bg-white/70 px-3 py-2 dark:bg-white/10">
                  <div>
                    <p className="text-sm font-semibold text-gray-900 dark:text-white">
                      Cuota {cuota.numeroCuota}/{cuota.totalCuotas}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-300">
                      {formatDateOnly(cuota.fechaCuota, { day: '2-digit', month: 'short' })}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-[#0b2e33] dark:text-white">{formatCurrency(cuota.montoCuota)}</p>
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
