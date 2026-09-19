import { getTitularApellidoDisplay } from '../../shared/utils/titulares.helpers';
import type { PasajeroResponse } from '../../pasajeros/types/pasajero.types';
import type { TransporteTipo } from '../../shared/types/transporte.types';

export interface TitularDelViaje {
  titularId: number;
  apellido: string;
  tieneUbicacion: boolean;
}

/** Titulares únicos que viajan en un horario con un transporte, con si tienen pin cargado. */
export const getTitularesDelViaje = (
  pasajeros: PasajeroResponse[],
  horarioId: number,
  transporte: TransporteTipo,
  ubicacionPorTitular: Map<number, boolean>,
): TitularDelViaje[] => {
  const vistos = new Map<number, TitularDelViaje>();

  for (const pasajero of pasajeros) {
    const viajaEnEsteVehiculo = pasajero.horariosAsignados.some(
      (asignacion) => asignacion.horarioId === horarioId && asignacion.transporte === transporte,
    );
    if (!viajaEnEsteVehiculo || vistos.has(pasajero.titularId)) {
      continue;
    }

    vistos.set(pasajero.titularId, {
      titularId: pasajero.titularId,
      apellido: getTitularApellidoDisplay(pasajero.titularApellido, pasajero.nombreCompleto),
      tieneUbicacion: ubicacionPorTitular.get(pasajero.titularId) ?? false,
    });
  }

  return Array.from(vistos.values()).sort((a, b) => a.apellido.localeCompare(b.apellido));
};

export const getParadaFijaErrorMessage = (error: unknown): string =>
  error && typeof error === 'object' && 'message' in error
    ? String(error.message)
    : 'No se pudo guardar la casa fija';
