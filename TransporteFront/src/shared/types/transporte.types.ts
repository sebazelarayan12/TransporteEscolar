export const TRANSPORTE_TIPOS = {
  UNO: 1,
  DOS: 2,
} as const;

export type TransporteTipo = (typeof TRANSPORTE_TIPOS)[keyof typeof TRANSPORTE_TIPOS];

export const TRANSPORTE_LABELS: Record<TransporteTipo, string> = {
  [TRANSPORTE_TIPOS.UNO]: 'Transporte 1',
  [TRANSPORTE_TIPOS.DOS]: 'Transporte 2',
};

export const TRANSPORTE_LIST: TransporteTipo[] = [TRANSPORTE_TIPOS.UNO, TRANSPORTE_TIPOS.DOS];
