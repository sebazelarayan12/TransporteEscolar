import { useRef } from 'react';
import { Amount } from '../../shared/ui/Amount';
import { formatDateOnly } from '../../shared/utils/date.helpers';
import { CardActionsMenu, type CardActionItem } from './CardActionsMenu';
import { getCategoriaConfig } from '../constants/categorias.config';
import { anchorToStyle, buildGastoActions, type MobileMenuAnchor } from '../helpers/card-menu.helpers';
import { useGastoCardMenu } from '../hooks/useGastoCardMenu';
import { GASTO_ESTADOS, GASTO_TIPOS, type GastoItem } from '../types/gastos.types';

interface GastoCardProps {
  gasto: GastoItem;
  onEdit?: (gasto: GastoItem) => void;
  onDelete?: (gasto: GastoItem) => void;
  actionsDisabled?: boolean;
  onMarkVariablePaid?: (gasto: GastoItem) => void;
  markPaidDisabled?: boolean;
}

interface GastoCardBadgesProps {
  categoriaLabel: string;
  vehiculo?: string | null;
  showPendiente: boolean;
}

const GastoCardBadges = ({ categoriaLabel, vehiculo, showPendiente }: GastoCardBadgesProps) => (
  <div className="ml-auto flex flex-wrap justify-end gap-1.5">
    <span className="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.3em] text-slate-600 dark:bg-white/10 dark:text-slate-200">
      {categoriaLabel.toUpperCase()}
    </span>
    {vehiculo ? (
      <span className="inline-flex items-center gap-1 rounded-full bg-teal-500/15 px-2.5 py-1 text-[10px] font-semibold text-teal-800 dark:text-teal-200">
        <span className="material-symbols-rounded text-[11px]">airport_shuttle</span>
        {vehiculo}
      </span>
    ) : null}
    {showPendiente ? (
      <span className="inline-flex items-center rounded-full bg-amber-500/15 px-2 py-1 text-[10px] font-semibold text-amber-800 dark:text-amber-100">
        Pendiente
      </span>
    ) : null}
  </div>
);

interface GastoCardMenuProps {
  actions: CardActionItem[];
  disabled: boolean;
  isOpen: boolean;
  isMobile: boolean;
  mobileAnchor: MobileMenuAnchor | null;
  onOpenChange: (open: boolean) => void;
}

const GastoCardMenu = ({ actions, disabled, isOpen, isMobile, mobileAnchor, onOpenChange }: GastoCardMenuProps) => {
  if (isMobile) {
    return (
      <div
        className={`fixed z-30 md:hidden ${isOpen ? 'pointer-events-auto' : 'pointer-events-none'}`}
        style={anchorToStyle(mobileAnchor)}
      >
        <CardActionsMenu
          items={actions}
          disabled={disabled}
          open={isOpen}
          onOpenChange={onOpenChange}
          hideTrigger
          menuOffsetClassName="left-1/2 top-0 w-[calc(100%-1.5rem)] max-w-[360px] -translate-x-1/2 -translate-y-[calc(100%+0.75rem)]"
        />
      </div>
    );
  }

  return (
    <div className="absolute right-4 top-4 hidden md:block">
      <CardActionsMenu
        items={actions}
        disabled={disabled}
        open={isOpen}
        onOpenChange={onOpenChange}
        menuOffsetClassName="right-0 top-9"
      />
    </div>
  );
};

export const GastoCard = ({
  gasto,
  onEdit,
  onDelete,
  actionsDisabled = false,
  onMarkVariablePaid,
  markPaidDisabled = false,
}: GastoCardProps) => {
  const categoriaConfig = getCategoriaConfig(gasto.categoria);
  const showPendienteBadge = gasto.tipo !== GASTO_TIPOS.FIJO && gasto.estadoPago === GASTO_ESTADOS.PENDIENTE;
  const actions = buildGastoActions(gasto, { onEdit, onDelete, onMarkVariablePaid, markPaidDisabled });
  const cardRef = useRef<HTMLElement | null>(null);
  const menu = useGastoCardMenu(cardRef, actions.length > 0 && !actionsDisabled);

  return (
    <article
      ref={cardRef}
      className={`relative flex w-full flex-col gap-3 rounded-xl border border-slate-200/80 bg-white/90 p-4 md:pr-16 text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-md dark:border-white/10 dark:bg-slate-900/60 sm:gap-4 ${menu.cardControlsMenu ? 'cursor-pointer' : ''}`.trim()}
      {...menu.cardTriggerProps}
    >
      <div className="flex flex-wrap items-start justify-between gap-3 sm:gap-6">
        <div className="flex min-w-0 flex-1 items-start gap-3">
          <div className={`flex size-10 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br ${categoriaConfig.gradient}`}>
            <span className="material-symbols-rounded text-lg text-white" aria-hidden>
              {categoriaConfig.icon}
            </span>
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold leading-5 text-slate-900 break-words whitespace-pre-wrap dark:text-white">{gasto.descripcion}</p>
            <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
              {formatDateOnly(gasto.fechaCuota, { day: '2-digit', month: 'short' })} · {gasto.medioPago}
            </p>
          </div>
        </div>
        <div className="ml-auto flex flex-col items-end text-right flex-shrink-0">
          <p className="text-base font-semibold text-rose-500 dark:text-rose-300"><Amount value={gasto.monto} /></p>
        </div>
      </div>
      <GastoCardBadges categoriaLabel={categoriaConfig.label} vehiculo={gasto.vehiculo} showPendiente={showPendienteBadge} />
      {actions.length > 0 ? (
        <GastoCardMenu
          actions={actions}
          disabled={actionsDisabled}
          isOpen={menu.isMenuOpen}
          isMobile={menu.isMobile}
          mobileAnchor={menu.mobileMenuAnchor}
          onOpenChange={menu.handleMenuOpenChange}
        />
      ) : null}
    </article>
  );
};
