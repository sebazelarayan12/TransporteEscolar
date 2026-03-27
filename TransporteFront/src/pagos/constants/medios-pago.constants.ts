/**
 * Payment method constants
 * Single source of truth for payment methods across the application
 */

export const MEDIOS_PAGO = {
  EFECTIVO: 'Efectivo',
  TRANSFERENCIA: 'Transferencia',
  TARJETA: 'Tarjeta',
} as const;

export type MedioPago = (typeof MEDIOS_PAGO)[keyof typeof MEDIOS_PAGO];

/**
 * Tailwind classes for payment method badges
 */
export const MEDIO_PAGO_BADGE_CLASSES: Record<MedioPago, string> = {
  [MEDIOS_PAGO.EFECTIVO]: 'bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-400/10 dark:text-emerald-300',
  [MEDIOS_PAGO.TRANSFERENCIA]: 'bg-cyan-100 text-cyan-700 border-cyan-200 dark:bg-cyan-400/10 dark:text-cyan-300',
  [MEDIOS_PAGO.TARJETA]: 'bg-indigo-100 text-indigo-700 border-indigo-200 dark:bg-indigo-400/10 dark:text-indigo-300',
};
