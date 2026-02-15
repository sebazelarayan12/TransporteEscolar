import type { PasajeroTurno } from '../constants/turnos.constants';
import type { PasajeroHorarioAsignado, PasajeroResponse } from '../types/pasajero.types';

const FALLBACK_TURNO: PasajeroTurno = 'Mañana';
const HORARIO_SIN_ETIQUETA = 'Horario sin nombre';

export const getHorarioEtiquetaDisplay = (etiqueta?: string | null) => {
  const value = etiqueta?.trim();
  return value && value.length > 0 ? value : HORARIO_SIN_ETIQUETA;
};

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

export const getHorariosAsignados = (pasajero?: Pick<PasajeroResponse, 'horariosAsignados'>) =>
  pasajero?.horariosAsignados ?? [];

export const getHorarioPrincipal = (pasajero?: Pick<PasajeroResponse, 'horariosAsignados'>) =>
  getHorariosAsignados(pasajero).find((horario) => horario.esPrincipal) ?? null;

export const getHorarioPrincipalId = (pasajero?: Pick<PasajeroResponse, 'horariosAsignados'>) =>
  getHorarioPrincipal(pasajero)?.horarioId ?? null;

export const isPasajeroInHorario = (
  pasajero: Pick<PasajeroResponse, 'horariosAsignados'>,
  horarioId: number | null,
) => {
  if (!horarioId) return false;
  return getHorariosAsignados(pasajero).some((horario) => horario.horarioId === horarioId);
};

export const getPasajeroHorarioAsignado = (
  pasajero: Pick<PasajeroResponse, 'horariosAsignados'>,
  horarioId: number | null,
) => {
  if (!horarioId) return undefined;
  return getHorariosAsignados(pasajero).find((horario) => horario.horarioId === horarioId);
};

export const formatPasajeroHorariosListado = (horarios: PasajeroHorarioAsignado[] = []) =>
  horarios.map((horario) => getHorarioEtiquetaDisplay(horario.horarioEtiqueta)).join(', ');

const buildHorarioKey = (horario: PasajeroHorarioAsignado) =>
  `${horario.horarioId}-${horario.prioridad ?? 'sin-prioridad'}`;

export const formatPasajeroHorarioEtiqueta = (horario: PasajeroHorarioAsignado) =>
  getHorarioEtiquetaDisplay(horario.horarioEtiqueta);

export const getPasajeroHorariosResumen = (
  horarios: PasajeroHorarioAsignado[] = [],
  maxVisible?: number,
) => {
  const entries = horarios.map((horario) => ({
    key: buildHorarioKey(horario),
    label: formatPasajeroHorarioEtiqueta(horario),
  }));
  const limit = typeof maxVisible === 'number' ? Math.max(Math.floor(maxVisible), 0) : entries.length;
  const visible = limit === 0 ? [] : entries.slice(0, limit || entries.length);
  const remaining = Math.max(entries.length - visible.length, 0);

  return { visible, remaining };
};
