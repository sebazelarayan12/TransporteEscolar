/**
 * Balance calculation helpers
 * Pure functions for processing payment data
 */

import type { PagoMensual } from '../types/pago.types';

/**
 * Sorts payments by period (year and month ascending)
 * @param pagos - Array of monthly payments
 * @returns Sorted array (oldest first)
 */
export const ordenarPagosPorPeriodo = (pagos: PagoMensual[]): PagoMensual[] => {
  return [...pagos].sort((a, b) => {
    if (a.anio === b.anio) {
      return a.mes - b.mes;
    }
    return a.anio - b.anio;
  });
};

/**
 * Filters payments with outstanding balance
 * @param pagos - Array of monthly payments
 * @returns Payments with saldoPendiente > 0
 */
export const filtrarCuotasConDeuda = (pagos: PagoMensual[]): PagoMensual[] => {
  return pagos.filter((pago) => pago.saldoPendiente > 0);
};

/**
 * Finds the closest due date among payments with debt
 * @param cuotasConDeuda - Payments with outstanding balance
 * @returns ISO date string of closest due date or null
 */
export const obtenerProximoVencimiento = (cuotasConDeuda: PagoMensual[]): string | null => {
  return cuotasConDeuda.reduce<string | null>((closest, cuota) => {
    if (!closest) {
      return cuota.fechaVencimiento;
    }
    return new Date(cuota.fechaVencimiento) < new Date(closest) ? cuota.fechaVencimiento : closest;
  }, null);
};
