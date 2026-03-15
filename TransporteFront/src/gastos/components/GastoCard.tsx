import { type KeyboardEvent, useEffect, useState } from 'react';
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

  const showPendienteBadge = !isGastoFijo && gasto.estadoPago === GASTO_ESTADOS.PENDIENTE;
  const [isMenuOpen, setIsMenuOpen] = useState(false);

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
  if (showPendienteBadge && onMarkVariablePaid) {
    actions.push({
      id: 'mark-paid',
      label: 'Marcar pagado',
      icon: 'task_alt',
      onSelect: () => onMarkVariablePaid(gasto),
      disabled: markPaidDisabled,
    });
  }

  const hasActions = actions.length > 0;
  const isInteractive = hasActions && !actionsDisabled;

  useEffect(() => {
    if (!isInteractive && isMenuOpen) {
      setIsMenuOpen(false);
    }
  }, [isInteractive, isMenuOpen]);

  const handleCardClick = () => {
    if (!isInteractive) {
      return;
    }
    setIsMenuOpen((prev) => !prev);
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLElement>) => {
    if (!isInteractive) {
      return;
    }
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      setIsMenuOpen((prev) => !prev);
    }
  };

  return (
    <article
      className={`relative flex w-full flex-col gap-3 rounded-xl border border-slate-200/80 bg-white/90 p-4 sm:pr-16 text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-md dark:border-white/10 dark:bg-slate-900/60 sm:gap-4 ${isInteractive ? 'cursor-pointer' : ''}`.trim()}
      role={isInteractive ? 'button' : undefined}
      tabIndex={isInteractive ? 0 : undefined}
      aria-haspopup={isInteractive ? 'menu' : undefined}
      aria-expanded={isInteractive ? isMenuOpen : undefined}
      onClick={handleCardClick}
      onKeyDown={handleKeyDown}
    >
      <div className="flex flex-wrap items-start justify-between gap-3 sm:gap-6">
        <div className="flex min-w-0 flex-1 items-start gap-3">
          <div className={`flex size-10 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br ${categoriaConfig.gradient}`}>
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
        <div className="ml-auto flex flex-col items-end text-right flex-shrink-0">
          <p className="text-base font-semibold text-rose-500 dark:text-rose-300">{formatCurrency(gasto.monto)}</p>
        </div>
      </div>
      <div className="ml-auto flex flex-wrap justify-end gap-1.5">
        <span className="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.3em] text-slate-600 dark:bg-white/10 dark:text-slate-200">
          {categoriaConfig.label.toUpperCase()}
        </span>
        {showPendienteBadge ? (
          <span className="inline-flex items-center rounded-full bg-amber-500/15 px-2 py-1 text-[10px] font-semibold text-amber-800 dark:text-amber-100">
            Pendiente
          </span>
        ) : null}
      </div>
      {hasActions ? (
        <>
          <div className="absolute right-3 top-3 md:hidden">
            <CardActionsMenu
              items={actions}
              disabled={actionsDisabled}
              open={isMenuOpen}
              onOpenChange={setIsMenuOpen}
              hideTrigger
              menuOffsetClassName="bottom-full right-0 mb-2"
            />
          </div>
          <div className="absolute right-4 top-4 hidden md:block">
            <CardActionsMenu
              items={actions}
              disabled={actionsDisabled}
              open={isMenuOpen}
              onOpenChange={setIsMenuOpen}
              menuOffsetClassName="right-0 top-9"
            />
          </div>
        </>
      ) : null}
    </article>
  );
};
