import type { MovimientoHistorial } from '../types/movimientos.types';

export interface MovimientosSummary {
  totalMonto: number;
  breakdown: Record<string, number>;
}

/** Total transaccionado y desglose por medio de pago de una lista de movimientos. */
export const summarizeMovimientos = (movimientos: MovimientoHistorial[]): MovimientosSummary => {
  const breakdown: Record<string, number> = {};
  let totalMonto = 0;

  for (const movimiento of movimientos) {
    totalMonto += movimiento.monto;
    breakdown[movimiento.medioPago] = (breakdown[movimiento.medioPago] ?? 0) + movimiento.monto;
  }

  return { totalMonto, breakdown };
};
