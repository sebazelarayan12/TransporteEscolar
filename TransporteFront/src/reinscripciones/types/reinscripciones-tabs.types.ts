export const REINSCRIPCIONES_TABS = {
  REINSCRIPCIONES: 'reinscripciones',
  DICIEMBRE: 'diciembre',
} as const;

export type ReinscripcionesTab = (typeof REINSCRIPCIONES_TABS)[keyof typeof REINSCRIPCIONES_TABS];
