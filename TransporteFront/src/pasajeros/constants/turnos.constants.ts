export const TURNO_OPTIONS = [
  'Mañana',
  'Tarde',
  'Doble turno',
] as const;

export type PasajeroTurno = (typeof TURNO_OPTIONS)[number];
