/**
 * Hook for calculating priority balance state
 * Encapsulates the logic for determining which payment to prioritize
 */

import { useMemo } from 'react';
import type { PagoMensual } from '../types/pago.types';
import { ordenarPagosPorPeriodo, filtrarCuotasConDeuda, obtenerProximoVencimiento } from '../helpers/saldo.helpers';
import {
  SALDO_PRIORITARIO_ESTADO,
  type SaldoPrioritarioEstado,
  SALDO_PRIORITARIO_BADGE_BY_ESTADO,
  SALDO_PRIORITARIO_COLOR_BY_ESTADO,
} from '../constants/saldo-estados.constants';
import { formatCurrency } from '../../shared/utils/currency.helpers';
import { formatDateOnly } from '../../shared/utils/date.helpers';

interface UseSaldoPrioritarioResult {
  cuotaPrioritaria: PagoMensual | null;
  estado: SaldoPrioritarioEstado;
  badge: { label: string; className: string };
  colorClass: string;
  label: string;
  periodo: string;
  cuotasConDeuda: PagoMensual[];
  proximoVencimientoLabel: string;
}

/**
 * Determines priority balance based on current date and outstanding payments
 * Priority: current month > oldest debt
 * 
 * @param pagosTitular - Array of monthly payments for a titular
 * @returns Priority balance information with state, label, and styling
 */
export const useSaldoPrioritario = (pagosTitular: PagoMensual[] | undefined): UseSaldoPrioritarioResult => {
  return useMemo(() => {
    const pagosOrdenados = ordenarPagosPorPeriodo(pagosTitular ?? []);
    const cuotasConDeuda = filtrarCuotasConDeuda(pagosOrdenados);
    
    const proximoVencimientoIso = obtenerProximoVencimiento(cuotasConDeuda);
    const proximoVencimientoLabel = proximoVencimientoIso 
      ? formatDateOnly(proximoVencimientoIso) 
      : 'Sin deudas activas';

    const hoy = new Date();
    const diaActual = hoy.getDate();
    const mesActual = hoy.getMonth() + 1;
    const anioActual = hoy.getFullYear();

    const cuotaMesEnCurso = cuotasConDeuda.find(
      (cuota) => cuota.mes === mesActual && cuota.anio === anioActual
    );

    const cuotaPrioritaria = cuotaMesEnCurso ?? cuotasConDeuda[0] ?? null;

    const estado: SaldoPrioritarioEstado = (() => {
      if (!cuotaPrioritaria) {
        return SALDO_PRIORITARIO_ESTADO.AL_DIA;
      }

      if (
        cuotaPrioritaria.anio > anioActual ||
        (cuotaPrioritaria.anio === anioActual && cuotaPrioritaria.mes > mesActual)
      ) {
        return SALDO_PRIORITARIO_ESTADO.PROXIMO_PERIODO;
      }

      if (cuotaPrioritaria.anio === anioActual && cuotaPrioritaria.mes === mesActual) {
        return diaActual >= 11 
          ? SALDO_PRIORITARIO_ESTADO.VENCIDO 
          : SALDO_PRIORITARIO_ESTADO.MES_EN_CURSO;
      }

      return SALDO_PRIORITARIO_ESTADO.VENCIDO;
    })();

    const badge = SALDO_PRIORITARIO_BADGE_BY_ESTADO[estado];
    const colorClass = SALDO_PRIORITARIO_COLOR_BY_ESTADO[estado];
    const label = cuotaPrioritaria
      ? formatCurrency(Math.max(0, cuotaPrioritaria.saldoPendiente))
      : 'Sin deuda activa';
    const periodo = cuotaPrioritaria?.periodo ?? 'Sin deudas activas';

    return {
      cuotaPrioritaria,
      estado,
      badge,
      colorClass,
      label,
      periodo,
      cuotasConDeuda,
      proximoVencimientoLabel,
    };
  }, [pagosTitular]);
};
