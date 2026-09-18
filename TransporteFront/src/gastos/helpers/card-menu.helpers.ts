import { GASTO_ESTADOS, GASTO_TIPOS, type GastoItem } from '../types/gastos.types';
import type { CardActionItem } from '../components/CardActionsMenu';

export interface MobileMenuAnchor {
  top: number;
  left: number;
  width: number;
}

const MOBILE_MENU_GUTTER = 12;

const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max);

export const computeMobileMenuAnchor = (element: HTMLElement | null): MobileMenuAnchor | null => {
  if (!element) {
    return null;
  }

  const rect = element.getBoundingClientRect();
  const viewportWidth = window.innerWidth;
  const availableWidth = viewportWidth - MOBILE_MENU_GUTTER * 2;
  const width = Math.min(rect.width, availableWidth > 0 ? availableWidth : rect.width);
  const centeredLeft = rect.left + (rect.width - width) / 2;
  const maxLeft = Math.max(viewportWidth - width - MOBILE_MENU_GUTTER, MOBILE_MENU_GUTTER);

  return {
    top: rect.top,
    left: clamp(centeredLeft, MOBILE_MENU_GUTTER, maxLeft),
    width,
  };
};

export const anchorToStyle = (anchor: MobileMenuAnchor | null) =>
  anchor ? { top: `${anchor.top}px`, left: `${anchor.left}px`, width: `${anchor.width}px` } : undefined;

interface GastoActionHandlers {
  onEdit?: (gasto: GastoItem) => void;
  onDelete?: (gasto: GastoItem) => void;
  onMarkVariablePaid?: (gasto: GastoItem) => void;
  markPaidDisabled: boolean;
}

/** Acciones disponibles en el menú de una tarjeta de gasto. */
export const buildGastoActions = (gasto: GastoItem, handlers: GastoActionHandlers): CardActionItem[] => {
  const { onEdit, onDelete, onMarkVariablePaid, markPaidDisabled } = handlers;
  const isGastoFijo = gasto.tipo === GASTO_TIPOS.FIJO;
  const isPendienteVariable = !isGastoFijo && gasto.estadoPago === GASTO_ESTADOS.PENDIENTE;
  const actions: CardActionItem[] = [];

  if (isGastoFijo && onEdit) {
    actions.push({ id: 'edit', label: 'Editar', icon: 'edit', onSelect: () => onEdit(gasto) });
  }
  if (onDelete) {
    actions.push({ id: 'delete', label: 'Eliminar', icon: 'delete', onSelect: () => onDelete(gasto), destructive: true });
  }
  if (isPendienteVariable && onMarkVariablePaid) {
    actions.push({
      id: 'mark-paid',
      label: 'Marcar pagado',
      icon: 'task_alt',
      onSelect: () => onMarkVariablePaid(gasto),
      disabled: markPaidDisabled,
    });
  }

  return actions;
};
