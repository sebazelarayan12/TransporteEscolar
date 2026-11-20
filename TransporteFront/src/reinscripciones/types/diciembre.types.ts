// Espejo del contrato de GET /api/diciembre y PUT /api/diciembre/titulares/{titularId}

export const DICIEMBRE_ESTADOS = {
  PENDIENTE: 'Pendiente',
  VA: 'Va',
  NO_VA: 'NoVa',
} as const;

export type DiciembreEstado = (typeof DICIEMBRE_ESTADOS)[keyof typeof DICIEMBRE_ESTADOS];

export interface DiciembreTitularItem {
  titularId: number;
  apellido: string;
  nombreContacto: string;
  pasajeros: string[];
  estado: DiciembreEstado;
  montoPactado: number;
  montoDiciembre: number | null;
  pagoMensualId: number | null;
  totalPagado: number;
  cuotaPreexistente: boolean;
}

export interface DiciembreResponse {
  anio: number;
  titulares: DiciembreTitularItem[];
}

export interface ConfirmarDiciembreRequest {
  anio: number;
  va: boolean;
  monto: number | null;
}
