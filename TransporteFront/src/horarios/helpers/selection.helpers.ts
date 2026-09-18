import { TRANSPORTE_LIST, TRANSPORTE_TIPOS, type TransporteTipo } from '../../shared/types/transporte.types';
import { getPasajeroHorarioAsignado } from '../../pasajeros/helpers/horario.helpers';
import type { HorarioPasajerosResponse } from '../types/horario.types';

export type TransporteSelectionState = Record<TransporteTipo, Set<number>>;

export const createEmptySelectionState = (): TransporteSelectionState => ({
  [TRANSPORTE_TIPOS.UNO]: new Set<number>(),
  [TRANSPORTE_TIPOS.DOS]: new Set<number>(),
});

export const cloneSelectionState = (state: TransporteSelectionState): TransporteSelectionState => ({
  [TRANSPORTE_TIPOS.UNO]: new Set(state[TRANSPORTE_TIPOS.UNO]),
  [TRANSPORTE_TIPOS.DOS]: new Set(state[TRANSPORTE_TIPOS.DOS]),
});

const normalizeTransporte = (value?: number | null): TransporteTipo =>
  value === TRANSPORTE_TIPOS.DOS ? TRANSPORTE_TIPOS.DOS : TRANSPORTE_TIPOS.UNO;

const hasSetDifferences = (current: Set<number>, baseline: Set<number>) => {
  if (current.size !== baseline.size) return true;
  return Array.from(baseline).some((id) => !current.has(id));
};

export const hasSelectionDifferences = (current: TransporteSelectionState, baseline: TransporteSelectionState) =>
  TRANSPORTE_LIST.some((transporte) => hasSetDifferences(current[transporte], baseline[transporte]));

/** Selección de pasajeros por transporte según lo asignado hoy al horario. */
export const buildSelectionFromDetalle = (data: HorarioPasajerosResponse): TransporteSelectionState => {
  const selection = createEmptySelectionState();
  const asignados = data.pasajerosAsignados?.pasajeros;

  if (asignados?.length) {
    asignados.forEach((asignacion) => {
      selection[normalizeTransporte(asignacion.transporte)].add(asignacion.pasajeroId);
    });
    return selection;
  }

  data.pasajeros.forEach((pasajero) => {
    const asignacion = getPasajeroHorarioAsignado(pasajero, data.horario.id);
    if (asignacion) {
      selection[normalizeTransporte(asignacion.transporte)].add(pasajero.id);
    }
  });
  return selection;
};

export interface AdditionAssignment {
  pasajeroId: number;
  prioridad?: number;
  transporte: TransporteTipo;
}

export interface AssignmentPlan {
  additions: AdditionAssignment[];
  removals: number[];
}

/** Diferencias entre la selección actual y la base: qué pasajeros agregar y cuáles quitar del horario. */
export const buildAssignmentPlan = (
  selected: TransporteSelectionState,
  baseline: TransporteSelectionState,
): AssignmentPlan => {
  const additions: AdditionAssignment[] = [];
  const removals = new Set<number>();

  TRANSPORTE_LIST.forEach((transporte) => {
    const currentSet = selected[transporte];
    const baselineSet = baseline[transporte];
    const order = Array.from(currentSet);

    order
      .filter((id) => !baselineSet.has(id))
      .forEach((pasajeroId) => {
        const priorityIndex = order.indexOf(pasajeroId);
        additions.push({ pasajeroId, prioridad: priorityIndex >= 0 ? priorityIndex + 1 : undefined, transporte });
      });

    Array.from(baselineSet)
      .filter((id) => !currentSet.has(id))
      .forEach((id) => removals.add(id));
  });

  return { additions, removals: Array.from(removals) };
};

/** Agrupa asignaciones por pasajero para poder ejecutar en paralelo entre pasajeros y en orden dentro de cada uno. */
export const groupAdditionsByPasajero = (additions: AdditionAssignment[]): AdditionAssignment[][] => {
  const groups = new Map<number, AdditionAssignment[]>();
  additions.forEach((addition) => {
    groups.set(addition.pasajeroId, [...(groups.get(addition.pasajeroId) ?? []), addition]);
  });
  return Array.from(groups.values());
};
