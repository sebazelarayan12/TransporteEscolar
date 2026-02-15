import type { PasajeroTurno } from '../constants/turnos.constants';
import type { PasajeroHorarioAsignado, PasajeroResponse } from '../types/pasajero.types';

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
  horarios.map((horario) => horario.nombreHorario).join(', ');
