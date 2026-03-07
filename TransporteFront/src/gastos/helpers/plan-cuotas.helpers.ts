import { GASTO_ESTADOS, type GastoEstadoPago, type GastoItem } from '../types/gastos.types';

const ISO_DATE_LENGTH = 10;

export const normalizeDateInput = (value?: string | null): string => {
  if (!value) {
    return '';
  }
  return value.slice(0, ISO_DATE_LENGTH);
};

export const calculatePlanCuotasMontos = (total: number, cantidad: number): number[] => {
  if (cantidad <= 0) {
    return [];
  }

  const totalCents = Math.round(total * 100);
  const cuotaBase = Math.floor(totalCents / cantidad);
  const montos: number[] = [];

  for (let i = 0; i < cantidad; i++) {
    if (i === cantidad - 1) {
      const usedCents = cuotaBase * (cantidad - 1);
      const lastCuota = (totalCents - usedCents) / 100;
      montos.push(Number(lastCuota.toFixed(2)));
    } else {
      montos.push(Number((cuotaBase / 100).toFixed(2)));
    }
  }

  return montos;
};

type UpcomingCuotasParams = {
  gasto: GastoItem;
  maxItems?: number;
  fallbackEstado?: GastoEstadoPago;
};

export interface PlanCuotaResumen {
  numeroCuota: number;
  totalCuotas: number;
  fechaCuota: string;
  montoCuota: number;
  estadoPago: GastoEstadoPago;
}

const addMonths = (isoDate: string, monthsToAdd: number): string => {
  const date = new Date(isoDate);
  if (Number.isNaN(date.getTime())) {
    return isoDate;
  }
  const utcDate = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
  utcDate.setUTCMonth(utcDate.getUTCMonth() + monthsToAdd);
  return utcDate.toISOString().slice(0, ISO_DATE_LENGTH);
};

export const buildUpcomingCuotas = ({ gasto, maxItems = 3, fallbackEstado = GASTO_ESTADOS.PENDIENTE }: UpcomingCuotasParams): PlanCuotaResumen[] => {
  if (!gasto.esPlanCuotas || !gasto.fechaPrimeraCuota || !gasto.cantidadCuotas) {
    return [];
  }

  const totalCuotas = gasto.totalCuotas ?? gasto.cantidadCuotas;
  const numeroActual = gasto.numeroCuota ?? 1;
  const baseFecha = gasto.fechaPrimeraCuota;
  const montoPorCuota = gasto.montoCuota ?? gasto.monto;
  const items: PlanCuotaResumen[] = [];

  for (let cuota = numeroActual; cuota <= totalCuotas; cuota++) {
    if (items.length === maxItems) {
      break;
    }

    const monthsDiff = cuota - 1;
    const fechaCuota = cuota === numeroActual ? gasto.fechaCuota : addMonths(baseFecha, monthsDiff);
    const estadoPago: GastoEstadoPago = cuota === numeroActual ? gasto.estadoPago : fallbackEstado;

    items.push({
      numeroCuota: cuota,
      totalCuotas,
      fechaCuota,
      montoCuota: montoPorCuota,
      estadoPago,
    });
  }

  return items;
};
