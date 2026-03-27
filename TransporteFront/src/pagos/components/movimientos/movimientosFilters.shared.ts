import type { TitularOption } from './MovimientosTitularSearch';

export const MEDIOS_PAGO = ['todos', 'Efectivo', 'Transferencia', 'Tarjeta'] as const;

export type MedioPagoFiltro = (typeof MEDIOS_PAGO)[number];

export interface FiltersDraft {
  fechaDesde: string;
  fechaHasta: string;
  medioPago: MedioPagoFiltro;
  titular: TitularOption | null;
}

export const isValidDateInput = (value: string) => /^\d{4}-\d{2}-\d{2}$/.test(value);
