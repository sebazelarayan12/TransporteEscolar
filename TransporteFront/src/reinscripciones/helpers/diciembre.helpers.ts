import { truncateNumberTowardZero } from '../../shared/utils/number.helpers';
import {
  DICIEMBRE_ESTADOS,
  type ConfirmarDiciembreRequest,
  type DiciembreEstado,
  type DiciembreTitularItem,
} from '../types/diciembre.types';

export const DICIEMBRE_MONTO_MAXIMO = 10_000_000;

export const DICIEMBRE_MOTIVO_NO_VA_BLOQUEADO = 'La cuota de diciembre ya tiene pagos registrados';

export type DiciembreDecision = 'va' | 'noVa';

export interface ResumenDiciembre {
  pendientes: number;
  van: number;
  noVan: number;
  totalEsperado: number;
}

export const buildResumenDiciembre = (titulares: DiciembreTitularItem[]): ResumenDiciembre => {
  const resumen: ResumenDiciembre = { pendientes: 0, van: 0, noVan: 0, totalEsperado: 0 };

  for (const titular of titulares) {
    if (titular.estado === DICIEMBRE_ESTADOS.PENDIENTE) {
      resumen.pendientes += 1;
    } else if (titular.estado === DICIEMBRE_ESTADOS.VA) {
      resumen.van += 1;
      resumen.totalEsperado += titular.montoDiciembre ?? 0;
    } else {
      resumen.noVan += 1;
    }
  }

  return resumen;
};

/**
 * "No va" solo es posible si la cuota de diciembre no tiene pagos (regla del backend)
 */
export const puedeMarcarNoVa = (titular: DiciembreTitularItem): boolean => titular.totalPagado <= 0;

/**
 * Monto que se precarga en el input: el de diciembre existente o el pactado del titular
 */
export const montoInicialDiciembre = (titular: DiciembreTitularItem): number =>
  titular.montoDiciembre ?? titular.montoPactado;

export const buildConfirmarDiciembreRequest = (
  anio: number,
  decision: DiciembreDecision,
  monto: number | undefined,
): ConfirmarDiciembreRequest => {
  if (decision === 'noVa' || monto === undefined) {
    return { anio, va: false, monto: null };
  }

  return { anio, va: true, monto: truncateNumberTowardZero(monto) };
};

const ESTADO_LABELS: Record<DiciembreEstado, string> = {
  [DICIEMBRE_ESTADOS.PENDIENTE]: 'Pendiente',
  [DICIEMBRE_ESTADOS.VA]: 'Va',
  [DICIEMBRE_ESTADOS.NO_VA]: 'No va',
};

export const getDiciembreEstadoLabel = (estado: DiciembreEstado): string => ESTADO_LABELS[estado];

export const decisionDesdeEstado = (estado: DiciembreEstado): DiciembreDecision | undefined => {
  if (estado === DICIEMBRE_ESTADOS.VA) return 'va';
  if (estado === DICIEMBRE_ESTADOS.NO_VA) return 'noVa';
  return undefined;
};
