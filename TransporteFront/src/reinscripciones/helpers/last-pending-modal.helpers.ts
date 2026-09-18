import { DEFAULT_TITULAR_LABEL, getTitularApellidoDisplay } from '../../shared/utils/titulares.helpers';

export type LastPendingVariant = 'confirmar' | 'noContinua';

const DESCRIPTIONS: Record<LastPendingVariant, { ultimoPendiente: string; regular: string }> = {
  confirmar: {
    ultimoPendiente:
      'Esta confirmación cierra las reinscripciones pendientes de este titular y generará automáticamente las cuotas con el valor final calculado.',
    regular: 'Al confirmar vamos a generar las cuotas del titular usando el precio final calculado para este pasajero.',
  },
  noContinua: {
    ultimoPendiente:
      'Es el último pasajero pendiente de la familia. Al marcar que no continúa se liberará el cupo y no se generarán cuotas futuras.',
    regular:
      'Estás por marcar que este titular no continuará, liberando el cupo y deteniendo la planificación automática de cuotas.',
  },
};

export const getActionDescription = (variant: LastPendingVariant, isUltimoPendiente: boolean): string => {
  const descriptions = DESCRIPTIONS[variant];
  return isUltimoPendiente ? descriptions.ultimoPendiente : descriptions.regular;
};

/** Apellido del titular para mostrar, o undefined si no hay uno útil. */
export const getTitularDisplayOrUndefined = (titularNombre?: string): string | undefined => {
  if (!titularNombre) return undefined;
  const label = getTitularApellidoDisplay(undefined, titularNombre);
  return label === DEFAULT_TITULAR_LABEL ? undefined : label;
};
