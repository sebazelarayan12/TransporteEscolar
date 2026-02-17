export const GASTO_TIPOS = {
  FIJO: 'Fijo',
  VARIABLE: 'Variable',
} as const;

export type GastoTipo = (typeof GASTO_TIPOS)[keyof typeof GASTO_TIPOS];

export const GASTO_ESTADOS = {
  PENDIENTE: 'Pendiente',
  PAGADO: 'Pagado',
  PROGRAMADO: 'Programado',
} as const;

export type GastoEstadoPago = (typeof GASTO_ESTADOS)[keyof typeof GASTO_ESTADOS];

export interface ResumenTotales {
  totalCuotas: number;
  totalGastosFijos: number;
  totalGastosVariables: number;
  gananciaNeta: number;
}

export interface GastoItem {
  id: number;
  mes: number;
  anio: number;
  tipo: GastoTipo;
  categoria: string;
  descripcion: string;
  monto: number;
  fecha: string;
  medioPago: string;
  estadoPago: string;
  observaciones?: string | null;
  templateId?: number | null;
}

export interface ResumenMensualResponse {
  totales: ResumenTotales;
  gastosFijos: GastoItem[];
  gastosVariables: GastoItem[];
}

export interface CrearGastoFijoRequest {
  mes: number;
  anio: number;
  categoria: string;
  descripcion: string;
  monto: number;
  diaDeAplicacion: number;
  medioPago: string;
  observaciones?: string;
}

export interface CrearGastoVariableRequest {
  mes: number;
  anio: number;
  categoria: string;
  descripcion: string;
  monto: number;
  fecha: string; // YYYY-MM-DD
  medioPago: string;
  estadoPago: string;
  observaciones?: string;
}

export type GastosTabValue = 'variables' | 'fijos';

export const GASTO_CATEGORIAS = {
  FIJOS: [
    { value: 'Sueldos', label: 'Sueldos y cargas sociales' },
    { value: 'Seguros', label: 'Seguros y patentes' },
    { value: 'Servicios', label: 'Servicios y tasas' },
    { value: 'Alquiler', label: 'Alquiler y cocheras' },
    { value: 'Licencias', label: 'Licencias / software' },
  ],
  VARIABLES: [
    { value: 'Combustible', label: 'Combustible' },
    { value: 'Mantenimiento', label: 'Mantenimiento y repuestos' },
    { value: 'Insumos', label: 'Insumos del día a día' },
    { value: 'Peajes', label: 'Peajes y estacionamientos' },
    { value: 'Extraordinario', label: 'Extraordinarios' },
  ],
} as const;

export type GastoCategoriaValue =
  (typeof GASTO_CATEGORIAS.FIJOS)[number]['value'] |
  (typeof GASTO_CATEGORIAS.VARIABLES)[number]['value'];
