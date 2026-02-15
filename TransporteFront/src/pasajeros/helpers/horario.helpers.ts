import type { PasajeroTurno } from '../constants/turnos.constants';

const FALLBACK_TURNO: PasajeroTurno = 'Mañana';

export const inferirTurnoDesdeEtiqueta = (
  etiqueta?: string | null,
  fallback: PasajeroTurno = FALLBACK_TURNO,
): PasajeroTurno => {
  if (!etiqueta) return fallback;
  const trimmed = etiqueta.trim();
  const primerToken = trimmed.split(' ')[0];
  const hora = Number.parseInt(primerToken, 10);
  if (Number.isNaN(hora)) {
    return fallback;
  }
  return hora >= 12 ? 'Tarde' : 'Mañana';
};
