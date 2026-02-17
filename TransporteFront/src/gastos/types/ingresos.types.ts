export const INGRESO_TIPOS = {
  FIJO: 'Fijo',
  VARIABLE: 'Variable',
} as const;

export type IngresoTipo = (typeof INGRESO_TIPOS)[keyof typeof INGRESO_TIPOS];

export const INGRESO_ESTADOS_COBRO = {
  PENDIENTE: 'Pendiente',
  COBRADO: 'Cobrado',
  PROGRAMADO: 'Programado',
} as const;

export type IngresoEstadoCobro = (typeof INGRESO_ESTADOS_COBRO)[keyof typeof INGRESO_ESTADOS_COBRO];

export interface IngresoResumenTotales {
  totalCuotas: number;
  totalIngresosFijos: number;
  totalIngresosVariables: number;
  totalIngresosExternos: number;
  totalGastos: number;
  gananciaNeta: number;
}

export interface IngresoItem {
  id: number;
  mes: number;
  anio: number;
  tipo: IngresoTipo;
  categoria: string;
  descripcion: string;
  monto: number;
  fecha: string;
  medioCobro: string;
  estadoCobro: string;
  observaciones?: string | null;
  templateId?: number | null;
}

export interface IngresosResumenMensualResponse {
  totales: IngresoResumenTotales;
  ingresosFijos: IngresoItem[];
  ingresosVariables: IngresoItem[];
}

export interface CrearIngresoFijoRequest {
  mes: number;
  anio: number;
  categoria: string;
  descripcion: string;
  monto: number;
  diaDeAplicacion: number;
  medioCobro: string;
  observaciones?: string;
}

export interface CrearIngresoVariableRequest {
  mes: number;
  anio: number;
  categoria: string;
  descripcion: string;
  monto: number;
  fecha: string;
  medioCobro: string;
  estadoCobro: string;
  observaciones?: string;
}

export type IngresosTabValue = 'fijos' | 'variables';

export const INGRESO_CATEGORIAS = {
  FIJOS: [
    { value: 'Convenios', label: 'Convenios empresariales' },
    { value: 'Subsidios', label: 'Subsidios municipales o provinciales' },
    { value: 'Patrocinios', label: 'Patrocinios y sponsors' },
    { value: 'Publicidad', label: 'Publicidad sostenida' },
  ],
  VARIABLES: [
    { value: 'Eventos', label: 'Eventos especiales' },
    { value: 'VentaMateriales', label: 'Venta de materiales' },
    { value: 'AportesFamilias', label: 'Aportes extraordinarios de familias' },
    { value: 'Bonos', label: 'Bonos contribución' },
    { value: 'Otros', label: 'Otros ingresos puntuales' },
  ],
} as const;

export type IngresoCategoriaValue =
  (typeof INGRESO_CATEGORIAS.FIJOS)[number]['value'] |
  (typeof INGRESO_CATEGORIAS.VARIABLES)[number]['value'];
