import { type KeyboardEvent, useEffect, useRef, useState } from 'react';
import { formatCurrency } from '../../shared/utils/currency.helpers';
import { formatDateOnly } from '../../shared/utils/date.helpers';
import { CardActionsMenu, type CardActionItem } from './CardActionsMenu';
import { getCategoriaConfig } from '../constants/categorias.config';
import { GASTO_ESTADOS, GASTO_TIPOS, type GastoItem } from '../types/gastos.types';

type MobileMenuAnchor = {
  top: number;
  left: number;
  width: number;
};

const MOBILE_MENU_GUTTER = 12;

const clamp = (value: number, min: number, max: number) => {
  if (value < min) {
    return min;
  }
  if (value > max) {
    return max;
  }
  return value;
};

const computeMobileMenuAnchor = (element: HTMLElement | null): MobileMenuAnchor | null => {
  if (!element || typeof window === 'undefined') {
    return null;
  }

  const rect = element.getBoundingClientRect();
  const viewportWidth = window.innerWidth;
  const availableWidth = viewportWidth - MOBILE_MENU_GUTTER * 2;
  const width = Math.min(rect.width, availableWidth > 0 ? availableWidth : rect.width);
  const centeredLeft = rect.left + (rect.width - width) / 2;
  const maxLeft = Math.max(viewportWidth - width - MOBILE_MENU_GUTTER, MOBILE_MENU_GUTTER);
  const left = clamp(centeredLeft, MOBILE_MENU_GUTTER, maxLeft);

  return {
    top: rect.top,
    left,
    width,
  };
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

  const showPendienteBadge = !isGastoFijo && gasto.estadoPago === GASTO_ESTADOS.PENDIENTE;
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [mobileMenuAnchor, setMobileMenuAnchor] = useState<MobileMenuAnchor | null>(null);
  const [shouldUseCardTrigger, setShouldUseCardTrigger] = useState(() => {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
      return false;
    }
    return window.matchMedia('(max-width: 767px)').matches;
  });
  const cardRef = useRef<HTMLElement | null>(null);

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
  const cardControlsMenu = isInteractive && shouldUseCardTrigger;
  const mobileMenuStyle = mobileMenuAnchor
    ? {
        top: `${mobileMenuAnchor.top}px`,
        left: `${mobileMenuAnchor.left}px`,
        width: `${mobileMenuAnchor.width}px`,
      }
    : undefined;

  const handleMenuOpenChange = (nextOpen: boolean) => {
    if (nextOpen && cardControlsMenu) {
      setMobileMenuAnchor(computeMobileMenuAnchor(cardRef.current));
    }
    if (!nextOpen) {
      setMobileMenuAnchor(null);
    }
    setIsMenuOpen(nextOpen);
  };

  useEffect(() => {
    if (!isInteractive && isMenuOpen) {
      const closeMenu = () => {
        setIsMenuOpen(false);
        setMobileMenuAnchor(null);
      };

      if (typeof queueMicrotask === 'function') {
        queueMicrotask(closeMenu);
      } else {
        Promise.resolve().then(closeMenu);
      }
    }
  }, [isInteractive, isMenuOpen]);

  useEffect(() => {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
      return;
    }

    const mediaQuery = window.matchMedia('(max-width: 767px)');
    const handleChange = (event: MediaQueryListEvent) => {
      setShouldUseCardTrigger(event.matches);
    };

    if (typeof mediaQuery.addEventListener === 'function') {
      mediaQuery.addEventListener('change', handleChange);
      return () => {
        mediaQuery.removeEventListener('change', handleChange);
      };
    }

    mediaQuery.addListener(handleChange);
    return () => {
      mediaQuery.removeListener(handleChange);
    };
  }, []);

  useEffect(() => {
    if (!cardControlsMenu || !isMenuOpen || typeof window === 'undefined') {
      return;
    }

    const updateAnchor = () => {
      setMobileMenuAnchor(computeMobileMenuAnchor(cardRef.current));
    };

    updateAnchor();

    window.addEventListener('resize', updateAnchor);
    window.addEventListener('scroll', updateAnchor, true);

    return () => {
      window.removeEventListener('resize', updateAnchor);
      window.removeEventListener('scroll', updateAnchor, true);
    };
  }, [cardControlsMenu, isMenuOpen]);

  const handleCardClick = () => {
    if (!cardControlsMenu) {
      return;
    }
    handleMenuOpenChange(!isMenuOpen);
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLElement>) => {
    if (!cardControlsMenu) {
      return;
    }
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      handleMenuOpenChange(!isMenuOpen);
    }
  };

  return (
    <article
      ref={cardRef}
      className={`relative flex w-full flex-col gap-3 rounded-xl border border-slate-200/80 bg-white/90 p-4 md:pr-16 text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-md dark:border-white/10 dark:bg-slate-900/60 sm:gap-4 ${cardControlsMenu ? 'cursor-pointer' : ''}`.trim()}
      role={cardControlsMenu ? 'button' : undefined}
      tabIndex={cardControlsMenu ? 0 : undefined}
      aria-haspopup={cardControlsMenu ? 'menu' : undefined}
      aria-expanded={cardControlsMenu ? isMenuOpen : undefined}
      onClick={cardControlsMenu ? handleCardClick : undefined}
      onKeyDown={cardControlsMenu ? handleKeyDown : undefined}
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
          {shouldUseCardTrigger ? (
            <div
              className={`fixed z-30 md:hidden ${isMenuOpen ? 'pointer-events-auto' : 'pointer-events-none'}`}
              style={mobileMenuStyle}
            >
              <CardActionsMenu
                items={actions}
                disabled={actionsDisabled}
                open={isMenuOpen}
                onOpenChange={handleMenuOpenChange}
                hideTrigger
                menuOffsetClassName="left-1/2 top-0 w-[calc(100%-1.5rem)] max-w-[360px] -translate-x-1/2 -translate-y-[calc(100%+0.75rem)]"
              />
            </div>
          ) : (
            <div className="absolute right-4 top-4 hidden md:block">
              <CardActionsMenu
                items={actions}
                disabled={actionsDisabled}
                open={isMenuOpen}
                onOpenChange={handleMenuOpenChange}
                menuOffsetClassName="right-0 top-9"
              />
            </div>
          )}
        </>
      ) : null}
    </article>
  );
};
